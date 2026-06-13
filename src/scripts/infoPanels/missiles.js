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
        backdrop-filter: blur(5px);
        color: white;
        top: 8.5rem;
        border-radius: 8px;
        box-shadow: 0 2px 10px rgba(0,0,0,0.4);
        user-select: none;
        overflow: hidden;
    }
    #missileListHeader {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 5px 10px;
        cursor: pointer;
        background: rgba(255,255,255,0.1);
        font-size: 11px;
        letter-spacing: 0.05em;
        color: rgba(255,255,255,0.8);
        border-bottom: 1px solid rgba(255,255,255,0.1);
    }
    #missileListHeader:hover {
        background: rgba(255,255,255,0.15);
    }
    #missileListToggleIcon {
        font-size: 10px;
        transition: transform 0.25s ease;
        display: inline-block;
    }
    #missileListBody {
        padding: 6px 12px;
        transition: max-height 0.25s ease, padding 0.25s ease;
        max-height: 500px;
        overflow: hidden;
    }
    #missileListBody.collapsed {
        max-height: 0;
        padding-top: 0;
        padding-bottom: 0;
    }
    #missileListToggleIcon.collapsed {
        transform: rotate(-90deg);
    }
    </style>`).appendTo("head");
}

function createMissileList() {
  deleteMissileList();
  const missileListHTML = `
        <div id="missileListContainer">
            <div id="missileListHeader">
                <span>FOX-2 MISSILES</span>
                <span id="missileListToggleIcon">&#9660;</span>
            </div>
            <div id="missileListBody">
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
        </div>
    `;

  $("body").append(missileListHTML);
  bindMissileListEvents();
}

function deleteMissileList() {
  var element = document.getElementById("missileListContainer");
  if (element) element.parentNode.removeChild(element);
}

function bindMissileListEvents() {
  $(document).on("click.missileList", "#missileListHeader", function () {
    const body = document.getElementById("missileListBody");
    const icon = document.getElementById("missileListToggleIcon");
    body.classList.toggle("collapsed");
    icon.classList.toggle("collapsed");
  });
}

function unbindMissileListEvents() {
  $(document).off("click.missileList");
}

initStyles();
