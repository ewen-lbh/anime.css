const { anime } = require("../index.js").default

const line = function (it) {
  return ".spinner ." + it
}
const lines = function (it) {
  return it.map(line)
}
const T = 450
const timeline = anime.timeline("spinner", {
  loop: true,
  autoplay: true,
  duration: T,
  easing: "ease-in-out",
})
const keyframe = function (delay, obj) {
  return timeline.add(obj, delay * T)
}

keyframe(0, {
  targets: lines(["N-left", "E1-bottom", "E1-right", "W-bottom"]),
  strokeDashoffset: 0,
})

keyframe(1, {
  targets: lines(["E1-middle", "E2-middle", "W-middle"]),
  strokeDashoffset: 0,
})

keyframe(2, {
  targets: lines([
    "E1-top",
    "E2-bottom",
    "W-right",
    "N-right",
    "E1-left",
    "E2-left",
  ]),
  strokeDashoffset: 0,
})
keyframe(3, {
  targets: ".spinner",
  rotate: "1turn",
  duration: 1.5 * T,
})
keyframe(3, {
  targets: lines([
    "E1-top",
    "E2-bottom",
    "W-right",
    "N-right",
    "E1-left",
    "E2-left",
  ]),
  strokeDashoffset: 1010,
})
keyframe(4, {
  targets: lines(["E1-middle", "E2-middle", "W-middle"]),
  strokeDashoffset: 1010,
})
keyframe(4.5, {
  targets: lines(["N-left", "E1-bottom", "E1-right", "W-bottom"]),
  strokeDashoffset: 1010,
})


console.log(timeline.intoCSS())

// return document.spinnerAnimation = anime({
//   targets: lines(['N-left', 'E1-bottom', 'E1-right', 'W-bottom']),
//   strokeDashoffset: 0,
//   duration: T,
//   easing: 'easeInOutSine',
//   complete: function(){
//     console.log('completed-initial-anim');
//     return document.spinnerTimeline.play();
//   }
// });
