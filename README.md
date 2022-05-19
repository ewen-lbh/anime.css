# Nîmes

> Ship [anime.js](https://animejs.com) animations with 0 bytes of Javascript

_Nîmes_ is a command-line tool to turn [anime.js](https://animejs.com) animations from a javascript file into a CSS file, containing the appropriate ruleset to implement the same animation without any trace of javascript.

[Features](#features) · [Installation](#installation) · [Usage](#usage) · [Examples](./examples/) · [Real-world usage](#real-world-usage)

## Features

Obviously, anime.js features that are inherently javascript-dependent can't be implemented. Most of these limitations come from the fact that no DOM is available while generating the stylesheet.

### Implemented

- [`anime.timeline`](https://animejs.com/documentation/#timelineBasics)
- [timeline offsets](https://animejs.com/documentation/#timelineOffsets), including relative offsets

### Planned

- [overriding of parameters in `timeline.add`](https://animejs.com/documentation/#TLParamsInheritance)
- `anime` API
- [keyframes](https://animejs.com/documentation/#propertyKeyframes)
- [Penner's easing functions](https://animejs.com/documentation/#pennerFunctions) (every easing function name that starts with `easeIn` or `easeOut`)
- [`anime.stagger`](https://animejs.com/documentation/#staggeringBasics)
- [default units for CSS transforms](https://animejs.com/documentation/#CSStransforms) (you have to explicitly specify the unit right now)
- [`endDelay`](https://animejs.com/documentation/#endDelay)
- [property-specific parameters](https://animejs.com/documentation/#specificPropParameters)
- a slightly different version of [function-based parameters](https://animejs.com/documentation/#functionBasedParameters) where the target argument hasn't been turned into a DOM node, but is still a selector string
- same goes for [function-based values](https://animejs.com/documentation/#functionBasedPropVal)
- [relative values](https://animejs.com/documentation/#relativeValues)
- [from-to values](https://animejs.com/documentation/#fromToValues)
- [SVG line drawing](https://animejs.com/documentation/#lineDrawing)
- [SVG morphing](https://animejs.com/documentation/#morphing)


### Out-of-scope / impossible to implement

_If you found a way to generate CSS that implements any of these, please open an issue with your idea or a pull request if you have an implementation ready_

- [SVG motion path](https://animejs.com/documentation/#motionPath)
- [callbacks & promises](https://animejs.com/documentation/#callbacks) (`complete`, `begin`, etc.)
- any target that isn't a CSS selector (Javascript objects, DOM Nodes)
- animating DOM attributes
- [function-based parameters](https://animejs.com/documentation/#functionBasedParameters)
- `round`
- [controls](https://animejs.com/documentation/#controls)
- all [helpers](https://animejs.com/documentation/#remove)

## Installation

    npm install nimes

## Usage

1. Remove any DOM-related code (you'll be running this script with Node.js)

1. Append the following line at the start of your anime.js script:

    ```js
    const {anime} = require("nimes").default;
    ```

2. Add a call to `.intoCSS` (the method takes no parameters) on the `anime.timeline` object you want to convert. 

   The return value is a string containing the entire stylesheet. 
   
   You can either `console.log` it to then pipe the stdout of `node your-script.js` to a file, or you can use `fs.writeFileSync` to write it to a file (or anything else really, it's just a string).

1. Run the script

    ```sh-session
    $ node my-script.js
    ```

## Real-world usage

- I am currently using this for my [portfolio](https://ewen.works)'s spinner that appears after clicking on a image to view it in full resolution.
