function initStyles() {
  $(`<style>
    #missileListContainer {
        position: absolute;
        right: 10px;
        width: 250px;
        max-width: 200px;
        min-width: 100px;
        background: rgba(0,0,0,0.75);
        z-index: 9999;
        font-family: 'Courier New', monospace;
        font-size: 13px;
        padding: 6px 12px;
        backdrop-filter: blur(5px);
        color: white;
        top: 8.5rem;
        border-radius: 8px;
        box-shadow: 0 2px 10px rgba(0,0,0,0.4);
        cursor: pointer;
        user-select: none;
        transition: opacity 0.3s;
    }
    </style>`).appendTo("head");
}

function createMissileList() {
  const missileListHTML = `
        <div id="missileListContainer" style="opacity: 1">
            - AIM-9 Sidewinder <br>
            - ASRAAM / AIM-132 <br>
            - IRIS-T <br>
            - AAM-3 <br>
            - Bozdoğan / Merlin <br>
            - Python 5 <br>
            - Magic II <br>
            - R.510 <br>
            - R.530 <br>
            - MAA-1 Piranha <br>
            - MICA IR <br>
            - PL-9 <br>
            - R-60 / AA-8 Aphid <br>
            - R-27T / AA-10T Alamo <br>
            - Sky Sword 1 / TC-1 <br>
            - R-73 / AA-11 Archer <br>
            - Izdeliye 72 (Izd 72) <br>
            - V3E A-Darter
        </div>
    `;

  $("body").append(missileListHTML);
}

initStyles();
createMissileList();

$(document).on("click", "#missileListContainer", function () {
  const el = this;
  el.style.opacity = el.style.opacity === "1" ? "0" : "1";
});
