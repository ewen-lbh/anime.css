import type {
  AnimeAnimParams,
  AnimeInstanceParams,
  AnimeParams,
  AnimeTimelineAnimParams,
} from "animejs"

import slugify from "slugify"
import cssbeautify from "cssbeautify"

type FunctionBasedParameter = (
  element: HTMLElement,
  index: number,
  length: number
) => number

type CSSTree =
  | { [selector: string]: CSSTree }
  | string
  | number
  | undefined
  | null

type AnimeCSSInstance = AnimeParams & {
  intoCSS: () => string
  timeline: AnimeCSSTimeline
  name: string
}

type AnimeCSSTimeline = AnimeParams & {
  resolvedKeyframes: AnimeCSSKeyframe[]
  name: string
  add: (params: AnimeAnimParams, timelineOffset?: string | number) => void
  intoCSS: () => string
}

type AnimeCSSKeyframe = {
  start: number
  end: number
  targets: AnimeAnimParams["targets"]
  properties: { [cssPropertyName: string]: string }
}

function except<V>(o: { [k: string]: V }, those: string[]): { [k: string]: V } {
  return Object.fromEntries(
    Object.entries(o).filter(([k, v]) => !those.includes(k))
  )
}

function last<T>(a: T[]): T {
  if (a.length === 0) {
    throw new Error("Cannot take last of empty array")
  }
  return a[a.length - 1]
}

function ensureNumber(n: string | number): number {
  if (typeof n === "string") {
    const parsed = parseFloat(n)
    if (Number.isNaN(parsed)) {
      throw new Error(`Could not parse ${n} as a number.`)
    }
    return parsed
  }
  return n
}

function ensureStringSelector(selector: any): string {
  if (typeof selector !== "string") {
    throw new Error(
      `Use CSS selectors for targets instead of ${selector}. The DOM is not available here.`
    )
  }
  return selector
}

if (import.meta.vitest) {
  const { it, expect, describe } = import.meta.vitest
  describe("ensureStringSelector", () => {
    it("should throw an error when the selector is not a string", () => {
      expect(() => ensureStringSelector({})).toThrow()
    })
    it("should let a selector string pass through", () => {
      expect(
        ensureStringSelector("h1.hello:nth-child(5) > [data-thing] + p")
      ).toBe("h1.hello:nth-child(5) > [data-thing] + p")
    })
  })
}

function ensureNonFunctionBased<T>(
  name: string,
  param: T | CallableFunction
): T {
  if (typeof param === "function") {
    throw new Error(
      `Use a number for ${name}, function-based parameters are not available without the DOM.`
    )
  }
  return param
}

if (import.meta.vitest) {
  const { it, expect, describe } = import.meta.vitest
  describe("ensureNonFunctionBased", () => {
    it("lets a number pass through", () => {
      expect(ensureNonFunctionBased("duration", 100)).toBe(100)
    })
    it("fails for functions with a specific error message", () => {
      expect(() =>
        ensureNonFunctionBased("duration", (element, index, length) => 420)
      ).toThrow(
        "Use a number for duration, function-based parameters are not available without the DOM."
      )
    })
  })
}

function aggregateSelectors(tl: AnimeCSSTimeline): string[] {
  let selectors = new Set<string>()
  for (const keyframe of tl.resolvedKeyframes) {
    if (Array.isArray(keyframe.targets)) {
      for (const target of keyframe.targets) {
        selectors.add(ensureStringSelector(target))
      }
    } else {
      selectors.add(ensureStringSelector(keyframe.targets))
    }
  }
  return Array.from(selectors)
}

if (import.meta.vitest) {
  const { it, expect, describe } = import.meta.vitest
  describe("aggregateSelectors", () => {
    it("should correctly aggregate multiple keyframes", () => {
      const tl = timeline("test", {
        irrelevant: "property",
      })
      tl.add({
        targets: "h1",
      })
      tl.add({
        targets: ["h1", "h2"],
      })
      expect(aggregateSelectors(tl)).toEqual(["h1", "h2"])
    })
  })
}
function resolveTimelineOffset(
  tl: AnimeCSSTimeline,
  to: string | number | undefined | null
): number {
  const from =
    tl.resolvedKeyframes.length === 0 ? 0 : last(tl.resolvedKeyframes).end
  if (to === undefined || to === null) {
    return from
  }
  if (typeof to === "number") {
    return to
  }
  const operator = /^(\*=|\+=|-=)/.exec(to)
  if (!operator) return ensureNumber(to)
  const y = parseFloat(to.replace(operator[0], ""))
  // TODO handle units (s, f, etc.) because right now all is in milliseconds
  switch (operator[0][0]) {
    case "+":
      return from + y
    case "-":
      return from - y
    case "*":
      return from * y
  }
}

if (import.meta.vitest) {
  const { it, expect, describe } = import.meta.vitest
  describe("resolveTimelineOffset", () => {
    it("correctly resolves negative relative offsets", () => {
      const tl = timeline("test", {
        irrelevant: "property",
        duration: 100,
      })
      expect(resolveTimelineOffset(tl, 500)).toBe(500)
      tl.add(
        {
          targets: "h1",
          some: "thing",
        },
        500
      )
      expect(resolveTimelineOffset(tl, undefined)).toBe(600)
      tl.add({
        targets: ["h1", "h2"],
        some: "other property",
      })
      expect(resolveTimelineOffset(tl, "-=50")).toBe(650)
    })
  })
}

function css(styles: CSSTree): string {
  let output = ""
  let transforms = ""
  let transformKeys = [
    "matrix",
    "translate",
    "translateX",
    "translateY",
    "scale",
    "scaleX",
    "scaleY",
    "rotate",
    "skew",
    "skewX",
    "skewY",
    "matrix3d",
    "translate3d",
    "translateZ",
    "scale3d",
    "scaleZ",
    "rotate3d",
    "rotateX",
    "rotateY",
    "rotateZ",
    "perspective",
  ]
  let stylesResolved = { ...styles }
  for (let [key, value] of Object.entries(stylesResolved)) {
    if (transformKeys.includes(key)) {
      transforms += `${key}(${value}) `
      delete stylesResolved[key]
    }
  }
  stylesResolved["transform"] = transforms
  let filters = ""
  let filterKeys = [
    "blur",
    "brightness",
    "contrast",
    "drop-shadow",
    "grayscale",
    "hue-rotate",
    "invert",
    "opacity",
    "saturate",
    "sepia",
  ]
  for (let [key, value] of Object.entries(stylesResolved)) {
    if (filterKeys.includes(key)) {
      filters += `${key}(${value}) `
      delete stylesResolved[key]
    }
  }
  stylesResolved["filter"] = filters
  for (let [key, value] of Object.entries(stylesResolved)) {
    if (Object.prototype.toString.call(value).indexOf("Object") > -1) {
      if (Object.values(value).filter(v => v !== "").length !== 0) {
        output += `${key} {\n${css(value)}}\n`
      }
    } else {
      if (key === "//") {
        output += `/* ${value} */\n`
      } else if (["", null, undefined].includes(value)) {
        output += ""
      } else {
        key = key
          .replace(/_/g, "-") // handle snake_case
          .replace(/([a-z0-9]|(?=[A-Z]))([A-Z])/g, "$1-$2") // handle camelCase
          .toLowerCase()
        output += `${key}: ${value};\n`
      }
    }
  }
  return cssbeautify(output, {
    indent: "  ",
    autosemicolon: true,
  })
}

if (import.meta.vitest) {
  const { it, expect, describe } = import.meta.vitest
  describe("css", () => {
    it("correctly outputs nested structures", () => {
      expect(
        css({
          "@media (max-width: 1000px)": {
            h1: {
              "font-size": "1.5em",
            },
            ".thing": {
              animation_play_state: "paused",
              animationIterationCount: 8,
              rotate: "1turn",
              translateX: "45px",
            },
          },
        })
      ).toBe(
        `@media (max-width: 1000px) {
  h1 {
    font-size: 1.5em;
  }

  .thing {
    animation-play-state: paused;
    animation-iteration-count: 8;
    transform: rotate(1turn) translateX(45px);
  }
}
`
      )
    })
  })
}

function animationName(tl: AnimeCSSTimeline, selector: string) {
  return `${tl.name}-${slugify(selector).replace(/\./g, "")}`
}

function keyframesOf(
  tl: AnimeCSSTimeline,
  selector: string
): AnimeCSSKeyframe[] {
  return tl.resolvedKeyframes.filter(
    keyframe =>
      keyframe.targets === selector ||
      (Array.isArray(keyframe.targets) && keyframe.targets.includes(selector))
  )
}

if (import.meta.vitest) {
  const { it, expect, describe } = import.meta.vitest
  describe("keyframesOf", () => {
    it("returns the set of keyframes that target the given selector", () => {
      const tl = timeline("testing", {
        duration: 300,
        easing: "ease-in-out",
      })
      tl.add({
        targets: "h1",
        opacity: 0,
      })
      tl.add({
        targets: ["h1", "span"],
        color: "red",
      })
      tl.add({
        targets: "span",
        background_color: "blue",
      })
      tl.add({
        targets: ["h1", "h2"],
        color: "green",
      })
      expect(keyframesOf(tl, "span")).toEqual([
        tl.resolvedKeyframes[1],
        tl.resolvedKeyframes[2],
      ])
    })
  })
}

function totalDuration(tl: AnimeCSSTimeline): number {
  if (tl.resolvedKeyframes.length === 0) {
    return 0
  }
  return last(tl.resolvedKeyframes).end
}

function cssTimingFunctionOf(easing: AnimeAnimParams["easing"]): string {
  const func = ensureNonFunctionBased<string>("easing", easing)
  if (func.startsWith("easeIn") || func.startsWith("easeOut")) {
    // TODO
    throw new Error(
      `Penner's easing functions are not supported yet. Use CSS timing functions instead.`
    )
  }
  return func.replace(/^cubicBezier/, "cubic-bezier")
}

function initialDelay(tl: AnimeCSSTimeline, selector?: string): number {
  const keyframes = selector !== undefined ? keyframesOf(tl, selector) : tl.resolvedKeyframes
  return keyframes.length === 0 ? 0 : keyframes[0].start
}

function timeline(name: string, params: AnimeParams): AnimeCSSTimeline {
  let tl = {
    ...params,
    name,
    resolvedKeyframes: [],
  } as AnimeCSSTimeline

  tl.add = (params: AnimeAnimParams, timelineOffset?: string | number) => {
    let start = resolveTimelineOffset(tl, timelineOffset)
    tl.resolvedKeyframes.push({
      properties: params,
      targets: params.targets,
      start,
      end:
        start +
        ensureNonFunctionBased<number>(
          "duration",
          params.duration || tl.duration || 0
        ),
    })
  }

  tl.intoCSS = () => {
    // console.log(tl.resolvedKeyframes)
    let output = ""
    for (const selector of aggregateSelectors(tl)) {
      const  iniDelay = initialDelay(tl, selector)
      output += `/** ${selector} **/\n`
      let cssKeyframes = {}
      const keyframes = keyframesOf(tl, selector)
      const percent = (v: number) =>
        `${((v - iniDelay) / (totalDuration(tl) - iniDelay)) * 100}%`
      for (let i = 0; i < keyframes.length; i++) {
        const k = keyframes[i]
        if (i == keyframes.length - 1) {
          cssKeyframes[percent(k.end)] = {
            "//": `at ${k.end} - ${iniDelay} ms`,
            ...except(k.properties, ["targets"]),
          }
          cssKeyframes["100%"] = except(k.properties, ["targets"])
        } else {
          cssKeyframes[percent(k.end)] = {
            "//": `at ${k.end} - ${iniDelay} ms`,
            ...except(k.properties, ["targets"]),
          }
          cssKeyframes[percent(keyframes[i + 1].start)] = {
            "//": `at ${keyframes[i + 1].start} - ${iniDelay} ms`,
            ...except(k.properties, ["targets"]),
          }
        }
      }
      output +=
        css({
          [`@keyframes ${animationName(tl, selector)}`]: cssKeyframes,
          [selector]: {
            animation: `${animationName(tl, selector)} ${totalDuration(tl)}ms`,
            animation_timing_function: cssTimingFunctionOf(params.easing),
            animation_direction: tl.direction,
            animation_iteration_count:
              tl.loop === true
                ? "infinite"
                : tl.loop === false
                ? undefined
                : tl.loop,
            animation_play_state: tl.autoplay ? "running" : "paused",
            animation_delay: `${iniDelay}ms`,
          },
        }) + "\n\n"
    }

    return output
  }

  return tl
}

function anime(name: string, params: AnimeParams): AnimeCSSInstance {
  let instance = params as AnimeCSSInstance
  // instance.intoCSS = () => {} // TODO
  instance.timeline = timeline(name, params)

  return instance
}

anime.timeline = timeline

export default { anime }
