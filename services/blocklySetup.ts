
// Initialize Blockly Setup

// --- CONSTANTS ---
export const HAT_BLOCKS = [
    'event_program_start', 
    'event_when_message', 
    'event_when_obstacle', 
    'event_when_color', 
    'event_when_ultrasonic'
];

/**
 * מפת צבעים אבסולוטית המסונכרנת עם ה-App והבמה.
 */
const CANONICAL_COLOR_MAP_FOR_BLOCKLY: Record<string, string> = {
    'red': '#EF4D47',     // Absolute Red
    'orange': '#EF8826',  // Absolute Orange
    'yellow': '#FFFF00',  // Absolute Yellow
    'green': '#00FF00',   // Absolute Green
    'blue': '#0000FF',    // Absolute Blue
    'purple': '#A855F7',  // Absolute Purple (Stop Line)
    'cyan': '#06B6D4',
    'magenta': '#EC4899',
    'black': '#000000',
    'white': '#FFFFFF',
};

// --- MESSAGE ICONS (SVG DATA URIs) ---
const MSG_ICONS = {
    RED_STAR: `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23EF4D47'%3E%3Cpath d='M12 1.7l3.09 6.26 6.91 1-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14l-5-4.87 6.91-1z'/%3E%3C/svg%3E`,
    BLUE_CIRCLE: `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%230000FF'%3E%3Ccircle cx='12' cy='12' r='10'/%3E%3C/svg%3E`,
    GREEN_SQUARE: `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%2300FF00'%3E%3Crect x='3' y='3' width='18' height='18' rx='2'/%3E%3C/svg%3E`,
    YELLOW_TRIANGLE: `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23FFFF00'%3E%3Cpath d='M1 21h22L12 2z'/%3E%3C/svg%3E`,
    ORANGE_HEART: `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23EF8826'%3E%3Cpath d='M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z'/%3E%3C/svg%3E`,
    PURPLE_MOON: `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23A855F7'%3E%3Cpath d='M12 3c.132 0 .263 0 .393.007a9 9 0 0 0 9.257 9.257c.01 1.056-.11 2.115-.365 3.15a9 9 0 1 1-9.285-12.414z'/%3E%3C/svg%3E`,
    CYAN_CLOUD: `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%2306B6D4'%3E%3Cpath d='M17.5 19c-3.037 0-5.5-2.463-5.5-5.5 0-.154.007-.306.021-.456a5.5 5.5 0 0 0-10.021 2.456C2 18.537 4.463 21 7.5 21h10c1.933 0 3.5-1.567 3.5-3.5S19.433 14 17.5 14c-.154 0-.306.007-.456.021a5.501 5.501 0 0 0-3.544-7.021 5.5 5.5 0 0 0-10.021 2.456'/%3E%3C/svg%3E`,
    PINK_DIAMOND: `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23EC4899'%3E%3Cpath d='M12 2L4 12l8 10 8-10L12 2z'/%3E%3C/svg%3E`
};

const DROPDOWN_OPTIONS = [
    [{src: MSG_ICONS.RED_STAR, width: 24, height: 24, alt: "Red Star"}, "RED_STAR"],
    [{src: MSG_ICONS.BLUE_CIRCLE, width: 24, height: 24, alt: "Blue Circle"}, "BLUE_CIRCLE"],
    [{src: MSG_ICONS.GREEN_SQUARE, width: 24, height: 24, alt: "Green Square"}, "GREEN_SQUARE"],
    [{src: MSG_ICONS.YELLOW_TRIANGLE, width: 24, height: 24, alt: "Yellow Triangle"}, "YELLOW_TRIANGLE"],
    [{src: MSG_ICONS.ORANGE_HEART, width: 24, height: 24, alt: "Orange Heart"}, "ORANGE_HEART"],
    [{src: MSG_ICONS.PURPLE_MOON, width: 24, height: 24, alt: "Purple Moon"}, "PURPLE_MOON"],
    [{src: MSG_ICONS.CYAN_CLOUD, width: 24, height: 24, alt: "Cyan Cloud"}, "CYAN_CLOUD"],
    [{src: MSG_ICONS.PINK_DIAMOND, width: 24, height: 24, alt: "Pink Diamond"}, "PINK_DIAMOND"]
];

// --- SCRATCH THEME DEFINITION ---
export const getScratchTheme = () => {
  const Blockly = (window as any).Blockly;
  if (!Blockly) return null;

  return Blockly.Theme.defineTheme('scratch', {
    'base': Blockly.Themes.Classic,
    'blockStyles': {
      'motion_blocks': { 'colourPrimary': '#4C97FF', 'colourSecondary': '#4280D7', 'colourTertiary': '#3373CC' },
      'looks_blocks': { 'colourPrimary': '#9966FF', 'colourSecondary': '#855CD6', 'colourTertiary': '#774DCB' },
      'pen_blocks': { 'colourPrimary': '#0FBD8C', 'colourSecondary': '#0DA57A', 'colourTertiary': '#0B8E69' },
      'events_blocks': { 'colourPrimary': '#FFBF00', 'colourSecondary': '#E6AC00', 'colourTertiary': '#CC9900' },
      'control_blocks': { 'colourPrimary': '#FFAB19', 'colourSecondary': '#EC9C13', 'colourTertiary': '#CF8B17' },
      'sensors_blocks': { 'colourPrimary': '#00C7E5', 'colourSecondary': '#00B8D4', 'colourTertiary': '#00ACC1' },
      'logic_blocks': { 'colourPrimary': '#59C059', 'colourSecondary': '#46B946', 'colourTertiary': '#389438' },
      'math_blocks': { 'colourPrimary': '#59C059', 'colourSecondary': '#46B946', 'colourTertiary': '#389438' },
      'variable_blocks': { 'colourPrimary': '#FF8C1A', 'colourSecondary': '#FF8000', 'colourTertiary': '#DB6E00' },
      'variable_dynamic_blocks': { 'colourPrimary': '#FF8C1A', 'colourSecondary': '#FF8000', 'colourTertiary': '#DB6E00' }
    },
    'categoryStyles': {
      'motion_category': { 'colour': '#4C97FF' },
      'looks_category': { 'colour': '#9966FF' },
      'pen_category': { 'colour': '#0FBD8C' },
      'events_category': { 'colour': '#FFBF00' },
      'control_category': { 'colour': '#FFAB19' },
      'sensors_category': { 'colour': '#00C7E5' },
      'logic_category': { 'colour': '#59C059' },
      'variables_category': { 'colour': '#FF8C1A' }
    },
    'componentStyles': {
      'workspaceBackgroundColour': '#F9F9F9',
      'toolboxBackgroundColour': '#FFFFFF',
      'toolboxForegroundColour': '#575E75',
      'flyoutBackgroundColour': '#F9F9F9',
      'flyoutOpacity': 1,
      'scrollbarColour': '#CECDCE',
      'insertionMarkerColour': '#000000',
      'insertionMarkerOpacity': 0.2,
      'cursorColour': '#000000',
    },
    'fontStyle': { 'family': '"Rubik", "Helvetica Neue", Helvetica, sans-serif', 'weight': 'bold', 'size': 11 }
  });
};

let blocklyInitialized = false;

export const initBlockly = () => {
  if (blocklyInitialized) return;
  const Blockly = (window as any).Blockly;
  const javascript = (window as any).javascript;
  const python = (window as any).python;
  if (!Blockly || !javascript || !python) return;
  
  const javascriptGenerator = javascript.javascriptGenerator;
  const pythonGenerator = python.pythonGenerator;

  if (Blockly.Blocks['controls_repeat_ext']) {
    const originalInit = Blockly.Blocks['controls_repeat_ext'].init;
    Blockly.Blocks['controls_repeat_ext'].init = function() {
      originalInit.call(this);
      this.setStyle('control_blocks');
    };
  }

  const wrapHatCode = (code: string) => `try {\n${code}\n} catch(e) { if (e.message !== "Simulation aborted") console.error('Script error:', e); }`;
  const getSafeVarName = (block: any, fieldName: string, generator: any) => generator.nameDB_.getName(block.getFieldValue(fieldName), 'VARIABLE');

  class FieldNumpad extends Blockly.FieldNumber {
    constructor(value?: any, min?: any, max?: any, precision?: any, validator?: any) { super(value, min, max, precision, validator); }
    showEditor_() {
        if (window.showBlocklyNumpad) {
            const bbox = this.getSvgRoot().getBoundingClientRect();
            window.showBlocklyNumpad(this.getValue(), (newValue) => { this.setValue(newValue); }, bbox);
        } else { super.showEditor_(); }
    }
  }

  class FieldDropperColor extends Blockly.FieldColour {
    constructor(value?: string, validator?: Function) { super(value, validator); }
    showEditor_() {
        const defaultColors = [
            CANONICAL_COLOR_MAP_FOR_BLOCKLY['red'],
            CANONICAL_COLOR_MAP_FOR_BLOCKLY['orange'],
            CANONICAL_COLOR_MAP_FOR_BLOCKLY['yellow'],
            CANONICAL_COLOR_MAP_FOR_BLOCKLY['green'],
            CANONICAL_COLOR_MAP_FOR_BLOCKLY['blue'],
            CANONICAL_COLOR_MAP_FOR_BLOCKLY['purple'],
            CANONICAL_COLOR_MAP_FOR_BLOCKLY['cyan'],
            CANONICAL_COLOR_MAP_FOR_BLOCKLY['magenta'],
            CANONICAL_COLOR_MAP_FOR_BLOCKLY['black'],
            CANONICAL_COLOR_MAP_FOR_BLOCKLY['white'],
        ];

        const pickerDiv = document.createElement('div');
        pickerDiv.className = 'p-3 bg-white rounded-xl shadow-xl border-2 border-slate-100 flex flex-col gap-3 min-w-[160px]';
        const grid = document.createElement('div');
        grid.className = 'grid grid-cols-4 gap-2';
        
        defaultColors.forEach(c => {
            const btn = document.createElement('button');
            btn.className = 'w-8 h-8 rounded-lg border border-slate-200 transition-transform hover:scale-110 active:scale-95 shadow-sm';
            btn.style.backgroundColor = c;
            btn.onclick = () => { this.setValue(c); Blockly.DropDownDiv.hideIfOwner(this); };
            grid.appendChild(btn);
        });
        pickerDiv.appendChild(grid);
        Blockly.DropDownDiv.getContentDiv().appendChild(pickerDiv);
        Blockly.DropDownDiv.setColour('#ffffff', '#ffffff');
        Blockly.DropDownDiv.showPositionedByField(this, () => {});
    }
  }

  Blockly.fieldRegistry.register('field_numpad', FieldNumpad);
  Blockly.fieldRegistry.register('field_dropper_color', FieldDropperColor);

  Blockly.Blocks['event_program_start'] = {
    init: function() {
      this.appendDummyInput().appendField("when").appendField(new Blockly.FieldImage("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='%234C97FF' stroke='%234C97FF' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z'/%3E%3Cline x1='4' y1='22' x2='4' y2='15'/%3E%3C/svg%3E", 20, 20, "Flag")).appendField("clicked");
      this.setNextStatement(true, null); this.setStyle('events_blocks');
    }
  };

  Blockly.Blocks['event_when_message'] = {
    init: function() {
        this.appendDummyInput().appendField("when message").appendField(new Blockly.FieldDropdown(DROPDOWN_OPTIONS), "MESSAGE").appendField("received");
        this.appendStatementInput("DO"); this.setStyle('events_blocks');
    }
  };

  Blockly.Blocks['event_send_message'] = {
    init: function() {
        this.appendDummyInput().appendField("broadcast").appendField(new Blockly.FieldDropdown(DROPDOWN_OPTIONS), "MESSAGE");
        this.setPreviousStatement(true, null); this.setNextStatement(true, null); this.setStyle('events_blocks');
    }
  };

  Blockly.Blocks['event_when_obstacle'] = {
      init: function() { this.appendDummyInput().appendField("when obstacle detected"); this.appendStatementInput("DO"); this.setStyle('events_blocks'); }
  };

  Blockly.Blocks['event_when_color'] = {
      init: function() {
          this.appendDummyInput().appendField("when color").appendField(new FieldDropperColor(CANONICAL_COLOR_MAP_FOR_BLOCKLY['yellow']), "COLOR").appendField("detected"); 
          this.appendStatementInput("DO"); this.setStyle('events_blocks');
      }
  };

  Blockly.Blocks['event_when_ultrasonic'] = {
    init: function() {
        this.appendDummyInput().appendField("when distance <").appendField(new FieldNumpad(20), "THRESHOLD").appendField("cm");
        this.appendStatementInput("DO"); this.setStyle('events_blocks');
    }
  };

  Blockly.Blocks['robot_drive_simple'] = {
    init: function() {
      this.appendDummyInput().appendField("drive").appendField(new Blockly.FieldDropdown([["forward","FORWARD"], ["backward","BACKWARD"]]), "DIRECTION");
      this.setPreviousStatement(true, null); this.setNextStatement(true, null); this.setStyle('motion_blocks');
    }
  };

  Blockly.Blocks['robot_move'] = {
    init: function() {
      this.appendDummyInput().appendField("drive").appendField(new Blockly.FieldDropdown([["forward","FORWARD"], ["backward","BACKWARD"]]), "DIRECTION").appendField("distance").appendField(new FieldNumpad(10), "DISTANCE").appendField("cm");
      this.setPreviousStatement(true, null); this.setNextStatement(true, null); this.setStyle('motion_blocks'); 
    }
  };

  Blockly.Blocks['robot_move_speed'] = {
    init: function() {
      this.appendDummyInput().appendField("drive").appendField(new Blockly.FieldDropdown([["forward","FORWARD"], ["backward","BACKWARD"]]), "DIRECTION").appendField("distance").appendField(new FieldNumpad(10), "DISTANCE").appendField("cm at speed").appendField(new FieldNumpad(50, 0, 100), "SPEED").appendField("%");
      this.setPreviousStatement(true, null); this.setNextStatement(true, null); this.setStyle('motion_blocks'); 
    }
  };

  Blockly.Blocks['robot_motor_on'] = {
    init: function() {
      this.appendDummyInput().appendField("set motor").appendField(new Blockly.FieldDropdown([["left","LEFT"], ["right","RIGHT"], ["both","BOTH"]]), "MOTOR").appendField("direction").appendField(new Blockly.FieldDropdown([["forward","FORWARD"], ["backward","BACKWARD"], ["stop","STOP"]]), "DIR").appendField("power").appendField(new FieldNumpad(100, -100, 100), "POWER").appendField("%");
      this.setPreviousStatement(true, null); this.setNextStatement(true, null); this.setStyle('motion_blocks');
    }
  };

  Blockly.Blocks['robot_drive_until'] = {
    init: function() {
      this.appendDummyInput().appendField("drive").appendField(new Blockly.FieldDropdown([["forward","FORWARD"], ["backward","BACKWARD"]]), "DIRECTION").appendField("until");
      this.appendValueInput("CONDITION").setCheck("Boolean");
      this.appendDummyInput().appendField("at speed").appendField(new FieldNumpad(50, 0, 100), "SPEED").appendField("%");
      this.setInputsInline(true); this.setPreviousStatement(true, null); this.setNextStatement(true, null); this.setStyle('motion_blocks'); 
    }
  };

  Blockly.Blocks['robot_turn_until'] = {
    init: function() {
      this.appendDummyInput().appendField("turn").appendField(new Blockly.FieldDropdown([["left","LEFT"], ["right","RIGHT"]]), "DIRECTION").appendField("until");
      this.appendValueInput("CONDITION").setCheck("Boolean");
      this.appendDummyInput().appendField("at speed").appendField(new FieldNumpad(50, 0, 100), "SPEED").appendField("%");
      this.setInputsInline(true); this.setPreviousStatement(true, null); this.setNextStatement(true, null); this.setStyle('motion_blocks');
    }
  };
  
  Blockly.Blocks['robot_stop'] = {
      init: function() { this.appendDummyInput().appendField("stop moving"); this.setPreviousStatement(true, null); this.setNextStatement(true, null); this.setStyle('motion_blocks'); }
  };

  Blockly.Blocks['robot_turn'] = {
    init: function() {
      this.appendDummyInput().appendField("turn").appendField(new Blockly.FieldDropdown([["right","RIGHT"], ["left","LEFT"]]), "DIRECTION").appendField("by").appendField(new FieldNumpad(90), "ANGLE").appendField("degrees at speed").appendField(new FieldNumpad(100, 0, 100), "SPEED").appendField("%"); 
      this.setPreviousStatement(true, null); this.setNextStatement(true, null); this.setStyle('motion_blocks');
    }
  };

  Blockly.Blocks['robot_set_heading'] = {
    init: function() {
      this.appendDummyInput().appendField("set heading to").appendField(new FieldNumpad(0, 0, 360), "ANGLE").appendField("degrees");
      this.setPreviousStatement(true, null); this.setNextStatement(true, null); this.setStyle('motion_blocks');
    }
  };

  Blockly.Blocks['robot_set_speed'] = {
      init: function() { this.appendDummyInput().appendField("set speed to").appendField(new FieldNumpad(100, 0, 100), "SPEED").appendField("%"); this.setPreviousStatement(true, null); this.setNextStatement(true, null); this.setStyle('motion_blocks'); }
  };

  Blockly.Blocks['robot_pen_down'] = { init: function() { this.appendDummyInput().appendField("pen down"); this.setPreviousStatement(true, null); this.setNextStatement(true, null); this.setStyle('pen_blocks'); } };
  Blockly.Blocks['robot_pen_up'] = { init: function() { this.appendDummyInput().appendField("pen up"); this.setPreviousStatement(true, null); this.setNextStatement(true, null); this.setStyle('pen_blocks'); } };
  Blockly.Blocks['robot_pen_set_color'] = { init: function() { this.appendDummyInput().appendField("set pen color").appendField(new FieldDropperColor(CANONICAL_COLOR_MAP_FOR_BLOCKLY['black']), "COLOR"); this.setPreviousStatement(true, null); this.setNextStatement(true, null); this.setStyle('pen_blocks'); } };
  Blockly.Blocks['robot_pen_clear'] = { init: function() { this.appendDummyInput().appendField("clear drawings"); this.setPreviousStatement(true, null); this.setNextStatement(true, null); this.setStyle('pen_blocks'); } };

  Blockly.Blocks['robot_led'] = {
    init: function() {
      this.appendDummyInput().appendField("set").appendField(new Blockly.FieldDropdown([["left","LEFT"], ["right","RIGHT"], ["both","BOTH"]]), "SIDE").appendField("LED to color").appendField(new FieldDropperColor(CANONICAL_COLOR_MAP_FOR_BLOCKLY['orange']), "COLOR"); 
      this.setPreviousStatement(true, null); this.setNextStatement(true, null); this.setStyle('looks_blocks');
    }
  };

  Blockly.Blocks['robot_led_set_color'] = {
    init: function() {
      this.appendDummyInput().appendField("set").appendField(new Blockly.FieldDropdown([["left","LEFT"], ["right","RIGHT"], ["both","BOTH"]]), "SIDE").appendField("LED");
      this.appendValueInput("COLOR").setCheck("String");
      this.setInputsInline(true); this.setPreviousStatement(true, null); this.setNextStatement(true, null); this.setStyle('looks_blocks');
    }
  };

  Blockly.Blocks['robot_led_off'] = {
    init: function() {
      this.appendDummyInput().appendField("turn").appendField(new Blockly.FieldDropdown([["left","LEFT"], ["right","RIGHT"], ["both","BOTH"]]), "SIDE").appendField("LED off");
      this.setPreviousStatement(true, null); this.setNextStatement(true, null); this.setStyle('looks_blocks');
    }
  };
  
  Blockly.Blocks['robot_wait'] = {
    init: function() { this.appendDummyInput().appendField("wait").appendField(new FieldNumpad(1), "SECONDS").appendField("seconds"); this.setPreviousStatement(true, null); this.setNextStatement(true, null); this.setStyle('control_blocks'); }
  };

  Blockly.Blocks['control_forever'] = {
    init: function() { this.appendDummyInput().appendField("forever"); this.appendStatementInput("DO"); this.setPreviousStatement(true, null); this.setNextStatement(false); this.setStyle('control_blocks'); }
  };

  Blockly.Blocks['control_wait_until'] = {
    init: function() { this.appendValueInput("CONDITION").setCheck("Boolean").appendField("wait until"); this.setPreviousStatement(true, null); this.setNextStatement(true, null); this.setStyle('control_blocks'); }
  };

  Blockly.Blocks['control_stop_program'] = {
    init: function() { this.appendDummyInput().appendField("stop program"); this.setPreviousStatement(true, null); this.setNextStatement(false); this.setStyle('control_blocks'); }
  };
  
  Blockly.Blocks['custom_if'] = {
    init: function() { this.appendValueInput('IF0').setCheck('Boolean').appendField("if"); this.appendStatementInput('DO0'); this.setPreviousStatement(true); this.setNextStatement(true); this.setStyle('control_blocks'); }
  };

  Blockly.Blocks['custom_if_else'] = {
    init: function() { this.appendValueInput('IF0').setCheck('Boolean').appendField("if"); this.appendStatementInput('DO0'); this.appendStatementInput('ELSE').appendField("else"); this.setPreviousStatement(true); this.setNextStatement(true); this.setStyle('control_blocks'); }
  };

  Blockly.Blocks['math_number'] = { init: function() { this.appendDummyInput().appendField(new FieldNumpad(0), 'NUM'); this.setOutput(true, 'Number'); this.setStyle('math_blocks'); } }
  Blockly.Blocks['math_round_down'] = { init: function() { this.appendValueInput("NUM").setCheck("Number").appendField("integer of"); this.setOutput(true, "Number"); this.setStyle('logic_blocks'); } };
  Blockly.Blocks['variables_get'] = { init: function() { this.appendDummyInput().appendField(new Blockly.FieldVariable('variable'), 'VAR'); this.setOutput(true, null); this.setStyle('variable_blocks'); } };
  Blockly.Blocks['variables_set'] = { init: function() { this.appendValueInput('VALUE').appendField('set').appendField(new Blockly.FieldVariable('variable'), 'VAR').appendField('to'); this.setPreviousStatement(true, null); this.setNextStatement(true, null); this.setStyle('variable_blocks'); } };
  Blockly.Blocks['math_change'] = { init: function() { this.appendValueInput('DELTA').appendField('change').appendField(new Blockly.FieldVariable('variable'), 'VAR').appendField('by'); this.setPreviousStatement(true, null); this.setNextStatement(true, null); this.setStyle('variable_blocks'); } };

  Blockly.Blocks['sensor_ultrasonic'] = { init: function() { this.appendDummyInput().appendField('distance from obstacle (cm)'); this.setOutput(true, "Number"); this.setStyle('sensors_blocks'); } };
  Blockly.Blocks['sensor_touch'] = { init: function() { this.appendDummyInput().appendField("touch sensor pressed?"); this.setOutput(true, "Boolean"); this.setStyle('sensors_blocks'); } };
  Blockly.Blocks['sensor_gyro'] = { init: function() { this.appendDummyInput().appendField("gyro").appendField(new Blockly.FieldDropdown([["angle", "ANGLE"], ["tilt", "TILT"]]), "MODE"); this.setOutput(true, "Number"); this.setStyle('sensors_blocks'); } };
  Blockly.Blocks['sensor_color'] = { init: function() { this.appendDummyInput().appendField("detected color"); this.setOutput(true, "String"); this.setStyle('sensors_blocks'); } };

  Blockly.Blocks['sensor_touching_color'] = {
    init: function() {
      this.appendDummyInput().appendField("touching color").appendField(new FieldDropperColor(CANONICAL_COLOR_MAP_FOR_BLOCKLY['orange']), "COLOR").appendField("?"); 
      this.setOutput(true, "Boolean"); this.setStyle('sensors_blocks');
    }
  };

  Blockly.Blocks['sensor_circumference'] = { init: function() { this.appendDummyInput().appendField('wheel circumference (cm)'); this.setOutput(true, "Number"); this.setStyle('sensors_blocks'); } };
  Blockly.Blocks['logic_negate'] = { init: function() { this.appendValueInput("BOOL").setCheck("Boolean").appendField("not"); this.setOutput(true, "Boolean"); this.setStyle('logic_blocks'); } };

  // --- JS GENERATORS ---
  javascriptGenerator.forBlock['event_program_start'] = () => '';
  javascriptGenerator.forBlock['event_when_message'] = (b: any) => `robot.onMessage('${b.getFieldValue('MESSAGE')}', async () => {\n${wrapHatCode(javascriptGenerator.statementToCode(b, 'DO'))}});\n`;
  javascriptGenerator.forBlock['event_send_message'] = (b: any) => `await robot.sendMessage('${b.getFieldValue('MESSAGE')}');\n`;
  javascriptGenerator.forBlock['event_when_obstacle'] = (b: any) => `robot.onObstacle(async () => {\n${wrapHatCode(javascriptGenerator.statementToCode(b, 'DO'))}});\n`;
  javascriptGenerator.forBlock['event_when_color'] = (b: any) => `robot.onColor('${b.getFieldValue('COLOR')}', async () => {\n${wrapHatCode(javascriptGenerator.statementToCode(b, 'DO'))}});\n`;
  javascriptGenerator.forBlock['event_when_ultrasonic'] = (b: any) => `robot.onDistance(${b.getFieldValue('THRESHOLD')}, async () => {\n${wrapHatCode(javascriptGenerator.statementToCode(b, 'DO'))}});\n`;
  javascriptGenerator.forBlock['robot_drive_simple'] = (b: any) => `await robot.setMotorPower(${b.getFieldValue('DIRECTION') === 'FORWARD' ? 100 : -100}, ${b.getFieldValue('DIRECTION') === 'FORWARD' ? 100 : -100});\n`;
  javascriptGenerator.forBlock['robot_move'] = (b: any) => `await robot.move(${b.getFieldValue('DIRECTION') === 'BACKWARD' ? -b.getFieldValue('DISTANCE') : b.getFieldValue('DISTANCE')});\n`;
  javascriptGenerator.forBlock['robot_move_speed'] = (b: any) => `await robot.setSpeed(${b.getFieldValue('SPEED')});\nawait robot.move(${b.getFieldValue('DIRECTION') === 'BACKWARD' ? -b.getFieldValue('DISTANCE') : b.getFieldValue('DISTANCE')});\n`;
  javascriptGenerator.forBlock['robot_motor_on'] = (b: any) => {
    const p = b.getFieldValue('DIR') === 'STOP' ? 0 : (b.getFieldValue('DIR') === 'BACKWARD' ? -b.getFieldValue('POWER') : b.getFieldValue('POWER'));
    const m = b.getFieldValue('MOTOR');
    return m === 'LEFT' ? `await robot.setLeftMotorPower(${p});\n` : m === 'RIGHT' ? `await robot.setRightMotorPower(${p});\n` : `await robot.setMotorPower(${p}, ${p});\n`;
  };
  javascriptGenerator.forBlock['robot_drive_until'] = (b: any) => `await robot.setSpeed(${b.getFieldValue('SPEED')});\nawait robot.setMotorPower(${b.getFieldValue('DIRECTION') === 'BACKWARD' ? -100 : 100}, ${b.getFieldValue('DIRECTION') === 'BACKWARD' ? -100 : 100});\nwhile (!(${javascriptGenerator.valueToCode(b, 'CONDITION', javascriptGenerator.ORDER_NONE) || 'false'})) { await robot.wait(10); }\nawait robot.stop();\n`;
  javascriptGenerator.forBlock['robot_turn_until'] = (b: any) => `await robot.setSpeed(${b.getFieldValue('SPEED')});\nawait robot.setMotorPower(${b.getFieldValue('DIRECTION') === 'LEFT' ? -100 : 100}, ${b.getFieldValue('DIRECTION') === 'LEFT' ? 100 : -100});\nwhile (!(${javascriptGenerator.valueToCode(b, 'CONDITION', javascriptGenerator.ORDER_NONE) || 'false'})) { await robot.wait(10); }\nawait robot.stop();\n`;
  javascriptGenerator.forBlock['robot_stop'] = () => 'await robot.stop();\n';
  javascriptGenerator.forBlock['robot_turn'] = (b: any) => `await robot.turn(${b.getFieldValue('DIRECTION') === 'RIGHT' ? b.getFieldValue('ANGLE') : -b.getFieldValue('ANGLE')}, ${b.getFieldValue('SPEED')});\n`;
  javascriptGenerator.forBlock['robot_set_heading'] = (b: any) => `await robot.setHeading(${b.getFieldValue('ANGLE')});\n`;
  javascriptGenerator.forBlock['robot_set_speed'] = (b: any) => `await robot.setSpeed(${b.getFieldValue('SPEED')});\n`;
  javascriptGenerator.forBlock['robot_pen_down'] = () => 'await robot.setPen(true);\n';
  javascriptGenerator.forBlock['robot_pen_up'] = () => 'await robot.setPen(false);\n';
  javascriptGenerator.forBlock['robot_pen_set_color'] = (b: any) => `await robot.setPenColor('${b.getFieldValue('COLOR')}');\n`;
  javascriptGenerator.forBlock['robot_pen_clear'] = () => 'await robot.clearPen();\n';
  javascriptGenerator.forBlock['robot_led'] = (b: any) => `robot.setLed('${b.getFieldValue('SIDE').toLowerCase()}', '${b.getFieldValue('COLOR')}');\n`;
  javascriptGenerator.forBlock['robot_led_set_color'] = (b: any) => `robot.setLed('${b.getFieldValue('SIDE').toLowerCase()}', ${javascriptGenerator.valueToCode(b, 'COLOR', javascriptGenerator.ORDER_ATOMIC) || "'black'"});\n`;
  javascriptGenerator.forBlock['robot_led_off'] = (b: any) => `robot.setLed('${b.getFieldValue('SIDE').toLowerCase()}', 'black');\n`;
  javascriptGenerator.forBlock['robot_wait'] = (b: any) => `await robot.wait(${b.getFieldValue('SECONDS') * 1000});\n`;
  javascriptGenerator.forBlock['control_forever'] = (b: any) => `while (true) {\n${javascriptGenerator.statementToCode(b, 'DO')}  await robot.wait(10);\n}\n`;
  javascriptGenerator.forBlock['control_wait_until'] = (b: any) => `while (!(${javascriptGenerator.valueToCode(b, 'CONDITION', javascriptGenerator.ORDER_ATOMIC) || 'false'})) {\n  await robot.wait(10);\n}\n`;
  javascriptGenerator.forBlock['control_stop_program'] = () => 'await robot.stopProgram();\n';
  javascriptGenerator.forBlock['controls_repeat_ext'] = (b: any) => {
    const repeats = javascriptGenerator.valueToCode(b, 'TIMES', javascriptGenerator.ORDER_ASSIGNMENT) || '0';
    const loopVar = javascriptGenerator.nameDB_ ? javascriptGenerator.nameDB_.getDistinctName('count', 'VARIABLE') : 'i';
    return `for (let ${loopVar} = 0; ${loopVar} < ${repeats}; ${loopVar}++) {\n${javascriptGenerator.statementToCode(b, 'DO')}}\n`;
  };
  javascriptGenerator.forBlock['custom_if'] = (b: any) => `if (${javascriptGenerator.valueToCode(b, 'IF0', javascriptGenerator.ORDER_NONE) || 'false'}) {\n${javascriptGenerator.statementToCode(b, 'DO0')}}\n`;
  javascriptGenerator.forBlock['custom_if_else'] = (b: any) => `if (${javascriptGenerator.valueToCode(b, 'IF0', javascriptGenerator.ORDER_NONE) || 'false'}) {\n${javascriptGenerator.statementToCode(b, 'DO0')}} else {\n${javascriptGenerator.statementToCode(b, 'ELSE')}}\n`;
  javascriptGenerator.forBlock['math_number'] = (b: any) => [parseFloat(b.getFieldValue('NUM')), b.getFieldValue('NUM') >= 0 ? javascriptGenerator.ORDER_ATOMIC : javascriptGenerator.ORDER_UNARY_NEGATION];
  javascriptGenerator.forBlock['math_round_down'] = (b: any) => [`Math.floor(${javascriptGenerator.valueToCode(b, 'NUM', javascriptGenerator.ORDER_NONE) || '0'})`, javascriptGenerator.ORDER_FUNCTION_CALL];
  javascriptGenerator.forBlock['variables_get'] = (b: any) => [getSafeVarName(b, 'VAR', javascriptGenerator), javascriptGenerator.ORDER_ATOMIC];
  javascriptGenerator.forBlock['variables_set'] = (b: any) => { const v = getSafeVarName(b, 'VAR', javascriptGenerator); return `${v} = ${javascriptGenerator.valueToCode(b, 'VALUE', javascriptGenerator.ORDER_ASSIGNMENT) || '0'};\nrobot.updateVariable('${v}', ${v});\n`; };
  javascriptGenerator.forBlock['math_change'] = (b: any) => { const v = getSafeVarName(b, 'VAR', javascriptGenerator); return `${v} = (Number(${v}) || 0) + ${javascriptGenerator.valueToCode(b, 'DELTA', javascriptGenerator.ORDER_ADDITION) || '0'};\nrobot.updateVariable('${v}', ${v});\n`; };
  javascriptGenerator.forBlock['sensor_ultrasonic'] = () => ['await robot.getDistance()', javascriptGenerator.ORDER_AWAIT || javascriptGenerator.ORDER_ATOMIC];
  javascriptGenerator.forBlock['sensor_touch'] = () => ['await robot.getTouch()', javascriptGenerator.ORDER_AWAIT || javascriptGenerator.ORDER_ATOMIC];
  javascriptGenerator.forBlock['sensor_gyro'] = (b: any) => [`await robot.getGyro('${b.getFieldValue('MODE')}')`, javascriptGenerator.ORDER_AWAIT || javascriptGenerator.ORDER_ATOMIC];
  javascriptGenerator.forBlock['sensor_color'] = () => ['await robot.getColor()', javascriptGenerator.ORDER_AWAIT || javascriptGenerator.ORDER_ATOMIC];
  javascriptGenerator.forBlock['sensor_touching_color'] = (b: any) => [`await robot.isTouchingColor('${b.getFieldValue('COLOR')}')`, javascriptGenerator.ORDER_AWAIT || javascriptGenerator.ORDER_ATOMIC];
  javascriptGenerator.forBlock['sensor_circumference'] = () => [`await robot.getCircumference()`, javascriptGenerator.ORDER_AWAIT || javascriptGenerator.ORDER_ATOMIC];
  javascriptGenerator.forBlock['logic_negate'] = (b: any) => ['!' + (javascriptGenerator.valueToCode(b, 'BOOL', javascriptGenerator.ORDER_LOGICAL_NOT) || 'true'), javascriptGenerator.ORDER_LOGICAL_NOT];

  // --- PYTHON GENERATORS ---
  pythonGenerator.forBlock['event_program_start'] = () => '';
  pythonGenerator.forBlock['event_when_message'] = (b: any) => `@robot.on_message('${b.getFieldValue('MESSAGE')}')\ndef on_msg():\n${pythonGenerator.prefixLines(pythonGenerator.statementToCode(b, 'DO') || 'pass', pythonGenerator.INDENT)}\n`;
  pythonGenerator.forBlock['event_send_message'] = (b: any) => `robot.send_message('${b.getFieldValue('MESSAGE')}')\n`;
  pythonGenerator.forBlock['event_when_obstacle'] = (b: any) => `@robot.on_obstacle\ndef on_obstacle():\n${pythonGenerator.prefixLines(pythonGenerator.statementToCode(b, 'DO') || 'pass', pythonGenerator.INDENT)}\n`;
  pythonGenerator.forBlock['event_when_color'] = (b: any) => `@robot.on_color('${b.getFieldValue('COLOR')}')\ndef on_color():\n${pythonGenerator.prefixLines(pythonGenerator.statementToCode(b, 'DO') || 'pass', pythonGenerator.INDENT)}\n`;
  pythonGenerator.forBlock['event_when_ultrasonic'] = (b: any) => `@robot.on_distance(${b.getFieldValue('THRESHOLD')})\ndef on_dist():\n${pythonGenerator.prefixLines(pythonGenerator.statementToCode(b, 'DO') || 'pass', pythonGenerator.INDENT)}\n`;
  pythonGenerator.forBlock['robot_drive_simple'] = (b: any) => { const p = b.getFieldValue('DIRECTION') === 'FORWARD' ? 100 : -100; return `robot.set_motor_power(${p}, ${p})\n`; };
  pythonGenerator.forBlock['robot_move'] = (b: any) => { const d = b.getFieldValue('DIRECTION') === 'BACKWARD' ? -b.getFieldValue('DISTANCE') : b.getFieldValue('DISTANCE'); return `robot.move(${d})\n`; };
  pythonGenerator.forBlock['robot_move_speed'] = (b: any) => { const d = b.getFieldValue('DIRECTION') === 'BACKWARD' ? -b.getFieldValue('DISTANCE') : b.getFieldValue('DISTANCE'); return `robot.set_speed(${b.getFieldValue('SPEED')})\nrobot.move(${d})\n`; };
  pythonGenerator.forBlock['robot_motor_on'] = (b: any) => {
    const p = b.getFieldValue('DIR') === 'STOP' ? 0 : (b.getFieldValue('DIR') === 'BACKWARD' ? -b.getFieldValue('POWER') : b.getFieldValue('POWER'));
    const m = b.getFieldValue('MOTOR');
    if (m === 'LEFT') return `robot.set_left_motor_power(${p})\n`;
    if (m === 'RIGHT') return `robot.set_right_motor_power(${p})\n`;
    return `robot.set_motor_power(${p}, ${p})\n`;
  };
  pythonGenerator.forBlock['robot_drive_until'] = (b: any) => {
    const cond = pythonGenerator.valueToCode(b, 'CONDITION', pythonGenerator.ORDER_NONE) || 'False';
    return `robot.set_speed(${b.getFieldValue('SPEED')})\nrobot.set_motor_power(${b.getFieldValue('DIRECTION') === 'BACKWARD' ? -100 : 100}, ${b.getFieldValue('DIRECTION') === 'BACKWARD' ? -100 : 100})\nwhile not (${cond}):\n${pythonGenerator.INDENT}robot.wait(0.01)\nrobot.stop()\n`;
  };
  pythonGenerator.forBlock['robot_turn_until'] = (b: any) => {
    const cond = pythonGenerator.valueToCode(b, 'CONDITION', pythonGenerator.ORDER_NONE) || 'False';
    return `robot.set_speed(${b.getFieldValue('SPEED')})\nrobot.set_motor_power(${b.getFieldValue('DIRECTION') === 'LEFT' ? -100 : 100}, ${b.getFieldValue('DIRECTION') === 'LEFT' ? 100 : -100})\nwhile not (${cond}):\n${pythonGenerator.INDENT}robot.wait(0.01)\nrobot.stop()\n`;
  };
  pythonGenerator.forBlock['robot_stop'] = () => 'robot.stop()\n';
  pythonGenerator.forBlock['robot_turn'] = (b: any) => { const a = b.getFieldValue('DIRECTION') === 'RIGHT' ? b.getFieldValue('ANGLE') : -b.getFieldValue('ANGLE'); return `robot.turn(${a}, ${b.getFieldValue('SPEED')})\n`; };
  pythonGenerator.forBlock['robot_set_heading'] = (b: any) => `robot.set_heading(${b.getFieldValue('ANGLE')})\n`;
  pythonGenerator.forBlock['robot_set_speed'] = (b: any) => `robot.set_speed(${b.getFieldValue('SPEED')})\n`;
  pythonGenerator.forBlock['robot_pen_down'] = () => 'robot.set_pen(True)\n';
  pythonGenerator.forBlock['robot_pen_up'] = () => 'robot.set_pen(False)\n';
  pythonGenerator.forBlock['robot_pen_set_color'] = (b: any) => `robot.set_pen_color('${b.getFieldValue('COLOR')}')\n`;
  pythonGenerator.forBlock['robot_pen_clear'] = () => 'robot.clear_drawings()\n';
  pythonGenerator.forBlock['robot_led'] = (b: any) => `robot.set_led('${b.getFieldValue('SIDE').toLowerCase()}', '${b.getFieldValue('COLOR')}')\n`;
  pythonGenerator.forBlock['robot_led_set_color'] = (b: any) => `robot.set_led('${b.getFieldValue('SIDE').toLowerCase()}', ${pythonGenerator.valueToCode(b, 'COLOR', pythonGenerator.ORDER_NONE) || "'black'"})\n`;
  pythonGenerator.forBlock['robot_led_off'] = (b: any) => `robot.set_led('${b.getFieldValue('SIDE').toLowerCase()}', 'black')\n`;
  pythonGenerator.forBlock['robot_wait'] = (b: any) => `robot.wait(${b.getFieldValue('SECONDS')})\n`;
  pythonGenerator.forBlock['control_forever'] = (b: any) => `while True:\n${pythonGenerator.prefixLines(pythonGenerator.statementToCode(b, 'DO') || 'pass', pythonGenerator.INDENT)}\n${pythonGenerator.INDENT}robot.wait(0.01)\n`;
  pythonGenerator.forBlock['control_wait_until'] = (b: any) => `while not (${pythonGenerator.valueToCode(b, 'CONDITION', pythonGenerator.ORDER_NONE) || 'False'}):\n${pythonGenerator.INDENT}robot.wait(0.01)\n`;
  pythonGenerator.forBlock['control_stop_program'] = () => 'robot.stop_program()\n';
  pythonGenerator.forBlock['custom_if'] = (b: any) => `if ${pythonGenerator.valueToCode(b, 'IF0', pythonGenerator.ORDER_NONE) || 'False'}:\n${pythonGenerator.prefixLines(pythonGenerator.statementToCode(b, 'DO0') || 'pass', pythonGenerator.INDENT)}\n`;
  pythonGenerator.forBlock['custom_if_else'] = (b: any) => `if ${pythonGenerator.valueToCode(b, 'IF0', pythonGenerator.ORDER_NONE) || 'False'}:\n${pythonGenerator.prefixLines(pythonGenerator.statementToCode(b, 'DO0') || 'pass', pythonGenerator.INDENT)}\nelse:\n${pythonGenerator.prefixLines(pythonGenerator.statementToCode(b, 'ELSE') || 'pass', pythonGenerator.INDENT)}\n`;
  pythonGenerator.forBlock['math_number'] = (b: any) => [parseFloat(b.getFieldValue('NUM')), pythonGenerator.ORDER_ATOMIC];
  pythonGenerator.forBlock['math_round_down'] = (b: any) => [`int(${pythonGenerator.valueToCode(b, 'NUM', pythonGenerator.ORDER_NONE) || '0'})`, pythonGenerator.ORDER_FUNCTION_CALL];
  pythonGenerator.forBlock['variables_get'] = (b: any) => [getSafeVarName(b, 'VAR', pythonGenerator), pythonGenerator.ORDER_ATOMIC];
  pythonGenerator.forBlock['variables_set'] = (b: any) => { const v = getSafeVarName(b, 'VAR', pythonGenerator); return `${v} = ${pythonGenerator.valueToCode(b, 'VALUE', pythonGenerator.ORDER_NONE) || '0'}\n`; };
  pythonGenerator.forBlock['math_change'] = (b: any) => { const v = getSafeVarName(b, 'VAR', pythonGenerator); return `${v} += ${pythonGenerator.valueToCode(b, 'DELTA', pythonGenerator.ORDER_NONE) || '0'}\n`; };
  pythonGenerator.forBlock['sensor_ultrasonic'] = () => ['robot.get_distance()', pythonGenerator.ORDER_FUNCTION_CALL];
  pythonGenerator.forBlock['sensor_touch'] = () => ['robot.get_touch()', pythonGenerator.ORDER_FUNCTION_CALL];
  pythonGenerator.forBlock['sensor_gyro'] = (b: any) => [`robot.get_gyro('${b.getFieldValue('MODE')}')`, pythonGenerator.ORDER_FUNCTION_CALL];
  pythonGenerator.forBlock['sensor_color'] = () => ['robot.get_color()', pythonGenerator.ORDER_FUNCTION_CALL];
  pythonGenerator.forBlock['sensor_touching_color'] = (b: any) => [`robot.is_touching_color('${b.getFieldValue('COLOR')}')`, pythonGenerator.ORDER_FUNCTION_CALL];
  pythonGenerator.forBlock['sensor_circumference'] = () => [`robot.get_wheel_circumference()`, pythonGenerator.ORDER_FUNCTION_CALL];
  pythonGenerator.forBlock['logic_negate'] = (b: any) => ['not ' + (pythonGenerator.valueToCode(b, 'BOOL', pythonGenerator.ORDER_LOGICAL_NOT) || 'True'), pythonGenerator.ORDER_LOGICAL_NOT];

  javascriptGenerator.workspaceToCode = function(workspace: any) {
    this.init(workspace);
    let initCode = ''; const vars = workspace.getAllVariables();
    if (vars.length > 0) { vars.forEach((v: any) => { const name = this.nameDB_.getName(v.name, 'VARIABLE'); initCode += `var ${name} = 0;\nrobot.updateVariable('${name}', 0);\n`; }); initCode += '\n'; }
    const topBlocks = workspace.getTopBlocks(true);
    const hatBlocks = topBlocks.filter((b: any) => HAT_BLOCKS.includes(b.type));
    const startBlocks = hatBlocks.filter((b: any) => b.type === 'event_program_start');
    const listenerBlocks = hatBlocks.filter((b: any) => b.type !== 'event_program_start');
    const listenerCode = listenerBlocks.map((b: any) => this.blockToCode(b)).join('\n');
    const startScripts = startBlocks.map((b: any) => this.blockToCode(b));
    const parallelInvocations = startScripts.map((script: string) => `(async () => { \n${wrapHatCode(script)}\n })()`).join(',\n          ');
    let combinedCode = initCode + listenerCode;
    if (startScripts.length > 0) { combinedCode += `\n\nawait Promise.all([\n          ${parallelInvocations}\n        ]);\n`; }
    return this.finish(combinedCode);
  };

  blocklyInitialized = true;
};

export const toolbox = {
  kind: "categoryToolbox",
  contents: [
    { kind: "category", name: "Events", categorystyle: "events_category", cssConfig: { "container": "category-events" }, contents: [{ kind: "block", type: "event_program_start" }, { kind: "block", type: "event_when_message" }, { kind: "block", type: "event_send_message" }, { kind: "block", type: "event_when_obstacle" }, { kind: "block", type: "event_when_color" }, { kind: "block", type: "event_when_ultrasonic" }] },
    { kind: "category", name: "Motion", categorystyle: "motion_category", cssConfig: { "container": "category-motion" }, contents: [{ kind: "block", type: "robot_drive_simple" }, { kind: "block", type: "robot_move" }, { kind: "block", type: "robot_move_speed" }, { kind: "block", type: "robot_motor_on" }, { kind: "block", type: "robot_drive_until" }, { kind: "block", type: "robot_turn_until" }, { kind: "block", type: "robot_stop" }, { kind: "block", type: "robot_turn" }, { kind: "block", type: "robot_set_heading" }, { kind: "block", type: "robot_set_speed" }] },
    { kind: "category", name: "Pen", categorystyle: "pen_category", cssConfig: { "container": "category-pen" }, contents: [{ kind: "block", type: "robot_pen_down" }, { kind: "block", type: "robot_pen_up" }, { kind: "block", type: "robot_pen_set_color" }, { kind: "block", type: "robot_pen_clear" }] },
    { kind: "category", name: "Looks", categorystyle: "looks_category", cssConfig: { "container": "category-looks" }, contents: [{ kind: "block", type: "robot_led" }, { kind: "block", type: "robot_led_set_color", inputs: { COLOR: { shadow: { type: "sensor_color" } } } }, { kind: "block", type: "robot_led_off" }] },
    { kind: "category", name: "Sensors", categorystyle: "sensors_category", cssConfig: { "container": "category-sensors" }, contents: [{ kind: "block", type: "sensor_ultrasonic" }, { kind: "block", type: "sensor_touch" }, { kind: "block", type: "sensor_gyro" }, { kind: "block", type: "sensor_color" }, { kind: "block", type: "sensor_touching_color" }, { kind: "block", type: "sensor_circumference" }] },
    { kind: "category", name: "Control", categorystyle: "control_category", cssConfig: { "container": "category-control" }, contents: [{ kind: "block", type: "robot_wait" }, { kind: "block", type: "control_forever" }, { kind: "block", type: "control_wait_until" }, { kind: "block", type: "control_stop_program" }, { kind: "block", type: "controls_repeat_ext", inputs: { TIMES: { shadow: { type: "math_number", fields: { NUM: 5 } } } } }, { kind: "block", type: "custom_if" }, { kind: "block", type: "custom_if_else" }] },
    { kind: "category", name: "Logic", categorystyle: "logic_category", cssConfig: { "container": "category-logic" }, contents: [{ kind: "block", type: "logic_compare", inputs: { A: { shadow: { type: "math_number", fields: { NUM: 10 } } }, B: { shadow: { type: "math_number", fields: { NUM: 10 } } } } }, { kind: "block", type: "logic_operation" }, { kind: "block", type: "logic_boolean" }, { kind: "block", type: "logic_negate" }, { kind: "block", type: "math_round_down", inputs: { NUM: { shadow: { type: "math_number", fields: { NUM: 12.7 } } } } }, { kind: "block", type: "math_arithmetic", inputs: { A: { shadow: { type: "math_number", fields: { NUM: 1 } } }, B: { shadow: { type: "math_number", fields: { NUM: 1 } } } } }, { kind: "block", type: "math_number" }] },
    { kind: "category", name: "Variables", categorystyle: "variables_category", custom: "VARIABLE", cssConfig: { "container": "category-variables" } }
  ]
};
