var hmdIsActive = new Boolean(0);

geofs.animation.values.hmdShow = null;
instruments.definitions.helmetMountedDisplay = {
  overlay: {
    url: "images/instruments/hud/frame.png",
    size: { x: 200, y: 200 },
    anchor: { x: 200, y: 200 },
    position: {
      x: window.innerWidth / 2,
      y: window.innerHeight / 2,
    },
    drawOrder: 1,
    rescale: true,
    rescalePosition: true,
    overlays: [
      {
        animations: [
          {
            type: "translateY",
            value: "kias",
            ratio: 2.1,
            offset: 10,
            min: 0,
            max: 1200,
          },
        ],
        url: "images/instruments/hud/kias.png",
        anchor: { x: 0, y: 100 },
        size: { x: 40, y: null },
        position: { x: -105, y: 10 },
        iconFrame: { x: 40, y: 160 },
        drawOrder: 1,
      },
      {
        animations: [
          {
            type: "translateY",
            value: "altThousands",
            ratio: 0.2385,
            offset: 280,
            min: 0,
            max: 100000,
          },
        ],
        url: "images/instruments/hud/altitude.png",
        anchor: { x: 0, y: 0 },
        size: { x: 25, y: null },
        position: { x: 85, y: -75 },
        iconFrame: { x: 32, y: 170 },
        drawOrder: 1,
      },
      {
        animations: [
          {
            type: "translateY",
            value: "altThousands",
            ratio: 0.238,
            offset: 95,
            min: 0,
            max: 100000,
          },
          {
            type: "translateX",
            value: "altTensShift",
            ratio: -22.7,
            min: 0,
            max: 100000,
          },
        ],
        name: "altten",
        url: "images/instruments/hud/altitudetens.png",
        anchor: { x: 0, y: 0 },
        size: { x: 167, y: 100 },
        position: { x: 77.5, y: -75 },
        iconFrame: { x: 15, y: 170 },
        drawOrder: 1,
      },
      {
        animations: [
          {
            type: "translateX",
            value: "heading360",
            ratio: -2.64,
            offset: 12,
          },
        ],
        url: "images/instruments/hud/compass.png",
        anchor: { x: 0, y: 0 },
        size: { x: 1000, y: null },
        offset: { x: 0, y: -10 },
        position: { x: -85, y: -135 },
        iconFrame: { x: 200, y: 30 },
        drawOrder: 1,
      },
      {
        animations: [
          {
            type: "translateY",
            value: "machUnits",
            ratio: 23,
            offset: 1,
          },
        ],
        url: "images/instruments/hud/digits.png",
        anchor: { x: 0, y: 0 },
        size: { x: 5.5, y: null },
        position: { x: -77.5, y: -101 },
        iconFrame: { x: 11, y: 23 },
        drawOrder: 2,
      },
      {
        animations: [
          {
            type: "translateY",
            value: "machTenth",
            ratio: 23,
            offset: 1,
          },
        ],
        url: "images/instruments/hud/digits.png",
        anchor: { x: 0, y: 0 },
        size: { x: 5.5, y: null },
        position: { x: -70.5, y: -101 },
        iconFrame: { x: 11, y: 23 },
        drawOrder: 2,
      },
      {
        animations: [
          {
            type: "translateY",
            value: "machHundredth",
            ratio: 23,
            offset: 1,
          },
        ],
        url: "images/instruments/hud/digits.png",
        anchor: { x: 0, y: 0 },
        size: { x: 5.5, y: null },
        position: { x: -65.5, y: -101 },
        iconFrame: { x: 11, y: 23 },
        drawOrder: 2,
      },
    ],
  },
};

const valid_ac_ids = [
  "4172",
  "2857",
  "7",
  "18",
  "27",
  "29",
  "2310",
  "5405",
  "3617",
  "5347",
];
valid_ac_ids.includes(geofs.aircraft.instance.id);

function checkIT() {
  if (valid_ac_ids.includes(geofs.aircraft.instance.id)) {
    if (hmdIsActive == 0) {
      geofs.aircraft.instance.setup.instruments.helmetMountedDisplay = {
        animations: [{ value: "hmdShow", type: "show", eq: "1" }],
      };
      instruments.init(geofs.aircraft.instance.setup.instruments);
      hmdIsActive = 1;
    }
    if (
      (geofs.camera.definitions["cockpit"].orientations.current[1] >= 5 ||
        geofs.camera.definitions["cockpit"].orientations.current[1] <= -35 ||
        geofs.camera.definitions["cockpit"].orientations.current[0] >= 35 ||
        geofs.camera.definitions["cockpit"].orientations.current[0] <= -35) &&
      geofs.camera.currentModeName == "cockpit"
    ) {
      geofs.animation.values.hmdShow = 1;
    } else {
      geofs.animation.values.hmdShow = 0;
    }
  } else {
    hmdIsActive = 0;
  }
}
checkITint = setInterval(function () {
  checkIT();
}, 100);

let isActive = false
geofs.animation.values.showHmd = null
const validAircraftIds = [
  "4172",
  "2857",
  "7",
  "18",
  "27",
  "29",
  "2310",
  "5405",
  "3617",
  "5347",
];

const updateHMDVisibility = () => {
    if (validAircraftIds.includes(geofs.aircraft.instance.id)) {
        if (!isActive) {
            geofs.aircraft.instance.setup.instruments.helmetMountedDisplay = {
                animations: [{ value: "showHmd", type: "show", eq: "1" }],
            };
            instruments.init(geofs.aircraft.instance.setup.instruments);
            isActive = true;
        }
        if (
            (geofs.camera.definitions["cockpit"].orientations.current[1] >= 5 ||
                geofs.camera.definitions["cockpit"].orientations.current[1] <= -35 ||
                geofs.camera.definitions["cockpit"].orientations.current[0] >= 35 ||
                geofs.camera.definitions["cockpit"].orientations.current[0] <= -35) &&
            geofs.camera.currentModeName === "cockpit"
        ) {
            geofs.animation.values.showHmd = 1;
        } else {
            geofs.animation.values.showHmd = 0;
        }
    }
}
