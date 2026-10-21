<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Soft UI Component Kit</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap" rel="stylesheet">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      min-height: 100vh;
      overflow: hidden;
      background: #e9eaee;
      font-family: "Inter", Arial, sans-serif;
    }
    #stage {
      position: absolute;
      left: 50%;
      top: 50%;
      width: 512px;
      height: 352px;
      margin: -176px 0 0 -256px;
      overflow: hidden;
      background: #e9eaee;
    }
    .soft {
      background: #e9eaee;
      border: 1px solid rgba(255,255,255,.72);
      box-shadow: 5px 5px 10px rgba(177,181,190,.55),
                  -5px -5px 10px rgba(255,255,255,.88);
    }
    .soft-inset {
      background: #e9eaee;
      border: 1px solid rgba(255,255,255,.75);
      box-shadow: inset 3px 3px 6px rgba(182,186,195,.5),
                  inset -3px -3px 6px rgba(255,255,255,.9);
    }
    .button, .input, .pill {
      position: absolute;
      height: 36px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 20px;
      color: #6d707a;
      font-size: 11px;
      font-weight: 500;
    }
    .button { top: 42px; left: 143px; width: 128px; }
    .input { top: 95px; left: 143px; width: 128px; }
    .share { top: 145px; left: 34px; width: 86px; height: 35px; gap: 5px; }
    .dropdown { top: 145px; left: 143px; width: 128px; height: 35px; justify-content: space-between; padding: 0 14px; }
    .label-pill { top: 195px; left: 34px; width: 86px; height: 35px; gap: 6px; }
    .add-user { top: 195px; left: 143px; width: 128px; height: 35px; gap: 7px; }
    .search { top: 247px; left: 34px; width: 238px; height: 33px; justify-content: flex-start; gap: 7px; padding: 0 15px; color: #92959e; }
    .type-tile {
      position: absolute;
      left: 32px;
      top: 42px;
      width: 85px;
      height: 84px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 19px;
      color: #2485db;
      font-size: 37px;
      font-weight: 500;
      letter-spacing: -2px;
    }
    .round-control {
      position: absolute;
      top: 94px;
      width: 34px;
      height: 34px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .radio-one { left: 298px; }
    .radio-two { left: 350px; }
    .radio-dot {
      width: 14px;
      height: 14px;
      border: 2px solid #aeb3bf;
      border-radius: 50%;
    }
    .radio-two .radio-dot {
      width: 12px;
      height: 12px;
      border: 0;
      background: #727887;
      box-shadow: 0 0 0 5px #d7d9df;
    }
    .chevron {
      width: 8px;
      height: 8px;
      border-top: 1.7px solid #8b909b;
      border-right: 1.7px solid #8b909b;
      transform: rotate(45deg);
    }
    .arrow-button {
      position: absolute;
      top: 42px;
      width: 34px;
      height: 34px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 11px;
    }
    .arrow-left { left: 298px; }
    .arrow-right { left: 350px; }
    .arrow-left .chevron { transform: rotate(225deg); }
    .toggle {
      position: absolute;
      left: 410px;
      width: 46px;
      height: 24px;
      border-radius: 14px;
      background: #e4e6eb;
      box-shadow: inset 2px 2px 4px rgba(182,186,195,.4),
                  inset -2px -2px 4px rgba(255,255,255,.8);
    }
    .toggle-one { top: 48px; }
    .toggle-two { top: 100px; background: #1759ec; }
    .toggle-knob {
      position: absolute;
      top: -3px;
      left: -2px;
      width: 26px;
      height: 26px;
      border-radius: 50%;
      background: #f9fafc;
      box-shadow: 2px 3px 7px rgba(153,158,168,.4),
                  -1px -1px 3px rgba(255,255,255,.9);
    }
    .toggle-two .toggle-knob { left: 20px; }
    .bars {
      position: absolute;
      left: 298px;
      top: 145px;
      width: 158px;
      height: 134px;
      display: flex;
      align-items: flex-end;
      gap: 14px;
    }
    .bar-track {
      position: relative;
      width: 21px;
      height: 100%;
      border-radius: 12px;
      border: 1px solid rgba(255,255,255,.7);
      box-shadow: inset 2px 2px 4px rgba(181,185,194,.38),
                  inset -2px -2px 4px rgba(255,255,255,.85);
    }
    .bar-fill {
      position: absolute;
      left: -1px;
      right: -1px;
      bottom: -1px;
      border-radius: 12px;
      background: linear-gradient(180deg, #2360f1 0%, #1453e8 100%);
      box-shadow: 0 2px 4px rgba(36,83,215,.22);
    }
    .bar-1 { height: 57px; }
    .bar-2 { height: 98px; }
    .bar-3 { height: 33px; }
    .bar-4 { height: 112px; }
    .bar-5 { height: 65px; }
    .progress-track {
      position: absolute;
      left: 39px;
      top: 330px;
      width: 420px;
      height: 8px;
      border-radius: 6px;
    }
    .progress-fill {
      position: absolute;
      left: 0;
      top: 0;
      width: 159px;
      height: 7px;
      border-radius: 6px;
      background: linear-gradient(90deg, #1558ee 0%, #31d0d2 100%);
    }
    .progress-thumb {
      position: absolute;
      left: 172px;
      top: 300px;
      width: 47px;
      height: 24px;
      border-radius: 7px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #676b76;
      font-size: 10px;
      font-weight: 500;
    }
    .progress-thumb::after {
      content: "";
      position: absolute;
      left: 20px;
      bottom: -5px;
      width: 8px;
      height: 8px;
      background: #e9eaee;
      border-right: 1px solid rgba(255,255,255,.7);
      border-bottom: 1px solid rgba(255,255,255,.7);
      transform: rotate(45deg);
    }
    svg { display: block; }
    .small-icon { width: 14px; height: 14px; color: #818692; }
  </style>
</head>
<body>
  <div id="stage">
    <div class="type-tile soft" data-name="Typography Tile">Aa</div>

    <div class="button soft" data-name="Primary Button">Button</div>
    <div class="input soft-inset" data-name="Input Field">Input</div>

    <div class="button pill share soft" data-name="Share Button">
      <span>Share</span>
      <svg class="small-icon" data-name="Share Icon" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <circle cx="18" cy="5" r="3" stroke="currentColor" stroke-width="2"/>
        <circle cx="6" cy="12" r="3" stroke="currentColor" stroke-width="2"/>
        <circle cx="18" cy="19" r="3" stroke="currentColor" stroke-width="2"/>
        <path d="m8.7 10.7 6.6-4.3M8.7 13.3l6.6 4.3" stroke="currentColor" stroke-width="2"/>
      </svg>
    </div>

    <div class="button pill dropdown soft" data-name="Dropdown Button">
      <span>Dropdown</span>
      <span class="chevron" data-name="Dropdown Chevron" style="transform:rotate(135deg);margin-top:-4px"></span>
    </div>

    <div class="button pill label-pill soft" data-name="Label Button">
      <svg class="small-icon" data-name="Location Pin Icon" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M19 10c0 5-7 11-7 11S5 15 5 10a7 7 0 1 1 14 0Z" stroke="currentColor" stroke-width="2"/>
        <circle cx="12" cy="10" r="2.2" stroke="currentColor" stroke-width="2"/>
      </svg>
      <span>Label</span>
    </div>

    <div class="button pill add-user soft" data-name="Add User Button">
      <svg class="small-icon" data-name="Add User Icon" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <circle cx="9" cy="8" r="4" stroke="currentColor" stroke-width="2"/>
        <path d="M2.5 20c.5-3.8 2.6-5.8 6.5-5.8 1.2 0 2.2.2 3.1.6M18 14v7m-3.5-3.5h7" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
      </svg>
      <span>Add User</span>
    </div>

    <div class="button pill search soft-inset" data-name="Search Field">
      <svg class="small-icon" data-name="Search Icon" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <circle cx="10.5" cy="10.5" r="6.5" stroke="currentColor" stroke-width="2"/>
        <path d="m15.5 15.5 5 5" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
      </svg>
      <span>Search for ...</span>
    </div>

    <div class="arrow-button soft" data-name="Previous Button">
      <span class="chevron"></span>
    </div>
    <div class="arrow-button arrow-right soft" data-name="Next Button">
      <span class="chevron"></span>
    </div>

    <div class="round-control radio-one soft" data-name="Radio Button">
      <div class="radio-dot" data-name="Radio Button Center"></div>
    </div>
    <div class="round-control radio-two soft" data-name="Selected Radio Button">
      <div class="radio-dot" data-name="Selected Radio Center"></div>
    </div>

    <div class="toggle toggle-one" data-name="Off Toggle">
      <div class="toggle-knob" data-name="Off Toggle Knob"></div>
    </div>
    <div class="toggle toggle-two" data-name="On Toggle">
      <div class="toggle-knob" data-name="On Toggle Knob"></div>
    </div>

    <div class="bars" data-name="Vertical Bar Chart">
      <div class="bar-track" data-name="Bar One"><div class="bar-fill bar-1"></div></div>
      <div class="bar-track" data-name="Bar Two"><div class="bar-fill bar-2"></div></div>
      <div class="bar-track" data-name="Bar Three"><div class="bar-fill bar-3"></div></div>
      <div class="bar-track" data-name="Bar Four"><div class="bar-fill bar-4"></div></div>
      <div class="bar-track" data-name="Bar Five"><div class="bar-fill bar-5"></div></div>
    </div>

    <div class="progress-thumb soft" data-name="Progress Tooltip">50%</div>
    <div class="progress-track soft-inset" data-name="Progress Track">
      <div class="progress-fill" data-name="Progress Fill"></div>
    </div>
  </div>

  <script>
    function fitToWindow() {
      const scale = Math.min(innerWidth / 512, innerHeight / 352);
      document.getElementById("stage").style.transform = `scale(${scale})`;
    }
    window.addEventListener("resize", fitToWindow);
    fitToWindow();
  </script>
</body>
</html>
