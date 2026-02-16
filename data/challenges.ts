
import { RobotState, CustomObject, SimulationHistory } from '../types';

export interface Challenge {
    id: string;
    title: string;
    description: string;
    difficulty: 'Easy' | 'Medium' | 'Hard';
    check: (startState: RobotState, endState: RobotState, history: SimulationHistory) => boolean;
    startPosition?: { x: number; y: number; z: number };
    startRotation?: number;
    environmentObjects?: CustomObject[];
    svgMap?: {
        svgString: string;
        worldWidth: number;
        worldHeight: number;
    };
}

export const CHALLENGES: Challenge[] = [
    // --- EASY CHALLENGES ---
    {
        id: 'c_square_loop',
        title: '1. Magic Square - Loops',
        description: 'Program the robot to drive on the white square track. Use the "repeat 4 times" block!',
        difficulty: 'Easy',
        check: (start, end, history) => end.x > 14 && end.z < 0,
        startPosition: { x: 0, y: 0, z: 0 },
        startRotation: 0, 
        environmentObjects: [
            { "id": "obj_1", "type": "PATH", "shape": "STRAIGHT", "x": 11.4, "z": -3.1, "width": 2.8, "length": 20, "rotation": 1.57, "color": "#FFFFFF" },
            { "id": "obj_2", "type": "PATH", "shape": "STRAIGHT", "x": 0, "z": -14.5, "width": 2.8, "length": 20, "rotation": 0, "color": "#FFFFFF" },
            { "id": "obj_3", "type": "PATH", "shape": "CORNER", "x": 0, "z": -3.1, "width": 2.8, "length": 2.8, "rotation": 0, "color": "#FFFFFF" },
            { "id": "obj_4", "type": "PATH", "shape": "CORNER", "x": 0, "z": -25.9, "width": 2.8, "length": 2.8, "rotation": -1.57, "color": "#FFFFFF" },
            { "id": "obj_5", "type": "PATH", "shape": "CORNER", "x": 22.8, "z": -25.9, "width": 2.8, "length": 2.8, "rotation": 3.14, "color": "#FFFFFF" },
            { "id": "obj_6", "type": "PATH", "shape": "STRAIGHT", "x": 11.4, "z": -25.9, "width": 2.8, "length": 20, "rotation": 1.57, "color": "#FFFFFF" },
            { "id": "obj_7", "type": "PATH", "shape": "STRAIGHT", "x": 22.8, "z": -14.5, "width": 2.8, "length": 20, "rotation": 0, "color": "#FFFFFF" },
            { "id": "obj_8", "type": "PATH", "shape": "CORNER", "x": 22.8, "z": -3.1, "width": 2.8, "length": 2.8, "rotation": 1.57, "color": "#FFFFFF" }
        ]
    },
    {
        id: 'c2',
        title: '2. נסיעה על קו וסיבוב',
        description: 'סע על המסלול השחור באורך 120 ס"מ. כשתגיע לקו הסיום האדום שנמצא בנקודת ה-100 ס"מ, בצע סיבוב של 360 מעלות ועצור.',
        difficulty: 'Easy',
        check: (start, end, history) => end.z <= -9.5 && history.detectedColors.some(c => c.toLowerCase() === 'red') && Math.abs(history.totalRotation) >= 350 && !end.isMoving,
        startPosition: { x: 0, y: 0, z: 0 },
        startRotation: 0,
        environmentObjects: [
            { "id": "track_c2", "type": "PATH", "shape": "STRAIGHT", "x": 0, "z": -6, "width": 2.8, "length": 12, "rotation": 0, "color": "#000000" },
            { "id": "finish_line_c2", "type": "COLOR_LINE", "x": 0, "z": -10, "width": 3, "length": 0.5, "color": "#EF4444" }
        ]
    },
    {
        id: 'c_color_run',
        title: '3. מהירות על פי צבע',
        description: 'קבע את מהירות הרובוט בהתאמה לצבע המסלול: אדום (20%), ירוק (100%), צהוב (50%), וכחול (80%). עצור בקו הסגול בסוף.',
        difficulty: 'Medium',
        check: (start, end, history) => {
            const hasStoppedAtEnd = end.z <= -39.5 && !end.isMoving;
            const hasSeenPurple = history.detectedColors.some(c => c.toLowerCase() === 'purple');
            return hasStoppedAtEnd && hasSeenPurple;
        },
        startPosition: { x: 0, y: 0, z: 0 },
        startRotation: 0,
        environmentObjects: [
            { "id": "track_red_c3", "type": "COLOR_LINE", "x": 0, "z": -5, "width": 2.8, "length": 10, "color": "#EF4444" },
            { "id": "track_green1_c3", "type": "COLOR_LINE", "x": 0, "z": -15, "width": 2.8, "length": 10, "color": "#22C55E" },
            { "id": "track_yellow_c3", "type": "COLOR_LINE", "x": 0, "z": -25, "width": 2.8, "length": 10, "color": "#EAB308" },
            { "id": "track_blue_c3", "type": "COLOR_LINE", "x": 0, "z": -35, "width": 2.8, "length": 10, "color": "#3B82F6" },
            { "id": "stop_line_c3", "type": "COLOR_LINE", "x": 0, "z": -40, "width": 3, "length": 0.5, "color": "#A855F7" }
        ]
    },
    {
        id: 'c4',
        title: '4. Speed - Emergency Brake',
        description: 'Drive fast and stop suddenly without sliding.',
        difficulty: 'Easy',
        check: (start, end, history) => history.maxDistanceMoved > 5 && !end.isMoving,
        startRotation: 0
    },
    {
        id: 'c6',
        title: '5. צומת T',
        description: 'סע ישר עד לצומת, פנה ימינה, והמשך עד סוף המסלול.',
        difficulty: 'Easy',
        check: (start, end, history) => end.x > 9 && Math.abs(end.z - (-20)) < 1.5 && !end.isMoving,
        startPosition: { x: 0, y: 0, z: 0 },
        startRotation: 0,
        environmentObjects: [
            { "id": "t_junction_vertical", "type": "PATH", "shape": "STRAIGHT", "x": 0, "z": -10, "width": 2.8, "length": 20, "rotation": 0, "color": "#FFFFFF" },
            { "id": "t_junction_horizontal", "type": "PATH", "shape": "STRAIGHT", "x": 0, "z": -20, "width": 2.8, "length": 20, "rotation": 1.5708, "color": "#FFFFFF" }
        ]
    },

    // --- MEDIUM CHALLENGES ---
    {
        id: 'c9',
        title: '6. Color ID - Multi-line Path',
        description: 'Drive along the path and identify 5 colored lines. The last line is a red stop line.',
        difficulty: 'Medium',
        check: (start, end, history) => {
            const requiredColors = ['magenta', 'cyan', 'yellow', 'green', 'red'];
            const foundCount = history.detectedColors.filter(c => requiredColors.includes(c.toLowerCase())).length;
            return end.z <= -14.8 && !end.isMoving && foundCount >= 4;
        },
        startPosition: { x: 0, y: 0, z: 0 },
        startRotation: 0,
        environmentObjects: [
            { id: 'line1', type: 'COLOR_LINE', x: 0, z: -3.0, width: 2.5, length: 0.1, color: '#D946EF' },
            { id: 'line2', type: 'COLOR_LINE', x: 0, z: -6.0, width: 2.5, length: 0.1, color: '#06B6D4' },
            { id: 'line3', type: 'COLOR_LINE', x: 0, z: -9.0, width: 2.5, length: 0.1, color: '#FACC15' },
            { id: 'line4', type: 'COLOR_LINE', x: 0, z: -12.0, width: 2.5, length: 0.1, color: '#22C55E' },
            { id: 'line5', type: 'COLOR_LINE', x: 0, z: -15.0, width: 2.5, length: 0.1, color: '#EF4444' }
        ]
    },
    {
        id: 'c1',
        title: '7. Room Navigation - Wall Course',
        description: 'Go through the wall corridor and reach the green target area without touching obstacles.',
        difficulty: 'Medium',
        check: (start, end, history) => end.x > 14 && end.z < 0,
        startPosition: { x: 0.10, y: 0, z: 0.10 },
        startRotation: 0,
        environmentObjects: [
            { "id": "w1", "type": "WALL", "x": -2.19, "z": -6.15, "width": 0.5, "length": 12, "rotation": 3.12, "color": "#ef4444" },
            { "id": "w2", "type": "WALL", "x": 2.26, "z": -3.97, "width": 0.5, "length": 7.75, "rotation": 0.00, "color": "#ef4444" },
            { "id": "w3", "type": "WALL", "x": 5.50, "z": -7.93, "width": 0.5, "length": 6.95, "rotation": 1.58, "color": "#ef4444" },
            { "id": "w4", "type": "WALL", "x": 3.48, "z": -12.26, "width": 0.5, "length": 11.56, "rotation": -1.57, "color": "#ef4444" }
        ]
    },
    {
        id: 'c5',
        title: '8. Traffic Light - Road Nav',
        description: 'Drive along the yellow road, turn right, and stop at the red line.',
        difficulty: 'Medium',
        check: (start, end, history) => end.x > 8 && end.z < -15,
        startPosition: { x: 0.00, y: 0, z: 0.00 },
        startRotation: 0,
        environmentObjects: [
            { "id": "p1", "type": "PATH", "shape": "STRAIGHT", "x": -0.03, "z": -8.67, "width": 2.8, "length": 14.01, "rotation": 3.13, "color": "#facc15" },
            { "id": "p2", "type": "PATH", "shape": "CORNER", "x": 0.00, "z": -16.67, "width": 2.8, "length": 2.8, "rotation": -1.56, "color": "#FFFF00" },
            { "id": "p3", "type": "PATH", "shape": "STRAIGHT", "x": 4.77, "z": -16.65, "width": 2.8, "length": 6.92, "rotation": 1.56, "color": "#FFFF00" },
            { "id": "l1", "type": "COLOR_LINE", "x": 8.99, "z": -16.62, "width": 2.8, "length": 1.67, "rotation": 1.56, "color": "#FF0000" }
        ]
    },
    {
        id: 'c7',
        title: '9. Slalom - Obstacle Course',
        description: 'Navigate around 4 colored obstacles and reach the end of the track.',
        difficulty: 'Medium',
        check: (start, end, history) => end.z < -22 && !history.touchedWall,
        startPosition: { x: 0, y: 0, z: 0 },
        startRotation: 0,
        environmentObjects: [
            { "id": "sl1", "type": "WALL", "x": 0, "z": -5, "width": 0.5, "length": 2, "color": "#ef4444" },
            { "id": "sl2", "type": "WALL", "x": 0, "z": -10, "width": 0.5, "length": 2, "color": "#3b82f6" },
            { "id": "sl3", "type": "WALL", "x": 0, "z": -15, "width": 0.5, "length": 2, "color": "#22c55e" },
            { "id": "sl4", "type": "WALL", "x": 0, "z": -20, "width": 0.5, "length": 2, "color": "#facc15" }
        ]
    },
    {
        id: 'c10',
        title: '10. Touch Sensor - Obstacle Retreat',
        description: 'Drive until you hit the wall. After touching it, drive backward to the green line.',
        difficulty: 'Medium',
        check: (start, end, history) => history.touchedWall && history.detectedColors.includes('green'),
        startRotation: 0,
        environmentObjects: [
            { id: 'w_hit', type: 'WALL', x: 0, z: -10, width: 6, length: 0.5, color: '#FF0000' },
            { id: 'l_green', type: 'COLOR_LINE', x: 0, z: 0.5, width: 2.5, length: 0.5, color: '#22c55e' }
        ]
    },
    {
        id: 'c10_lines',
        title: '11. Sensors - Line Counting',
        description: 'Count 5 black lines and stop at the red line.',
        difficulty: 'Medium',
        check: (start, end, history) => history.detectedColors.filter(c => c === 'black').length >= 4 && history.detectedColors.includes('red'),
        startRotation: 0,
        environmentObjects: [
            { id: 'l1', type: 'COLOR_LINE', x: 0, z: -2, width: 2.5, length: 0.1, color: '#000000' },
            { id: 'l2', type: 'COLOR_LINE', x: 0, z: -4, width: 2.5, length: 0.1, color: '#000000' },
            { id: 'l3', type: 'COLOR_LINE', x: 0, z: -6, width: 2.5, length: 0.1, color: '#000000' },
            { id: 'l4', type: 'COLOR_LINE', x: 0, z: -8, width: 2.5, length: 0.1, color: '#000000' },
            { id: 'l5', type: 'COLOR_LINE', x: 0, z: -10, width: 2.5, length: 0.1, color: '#000000' },
            { id: 'l_stop', type: 'COLOR_LINE', x: 0, z: -15, width: 2.5, length: 1, color: '#FF0000' }
        ]
    },
    {
        id: 'c_snake_path',
        title: '12. The Snake Path',
        description: 'Follow the white divider line, identify the colored markers along the way, and stop on the yellow square at the end.',
        difficulty: 'Medium',
        check: (start, end, history) => {
            const stopped = !end.isMoving;
            const detectedYellow = history.detectedColors.some(c => c.toLowerCase() === 'yellow' || c.toLowerCase() === '#ffff00');
            return stopped && detectedYellow;
        },
        startPosition: { x: 3.15, y: 0, z: 6.13 },
        startRotation: 0, 
        svgMap: {
            worldWidth: 24,
            worldHeight: 18,
            svgString: `<svg version="1.1" viewBox="0.0 0.0 960.0 720.0" fill="none" stroke="none" stroke-linecap="square" stroke-miterlimit="10" xmlns:xlink="http://www.w3.org/1999/xlink" xmlns="http://www.w3.org/2000/svg"><clipPath id="p.0"><path d="m0 0l960.0 0l0 720.0l-960.0 0l0 -720.0z" clip-rule="nonzero"/></clipPath><g clip-path="url(#p.0)" shape-rendering="geometricPrecision"><path fill="#000000" fill-opacity="0.0" d="m0 0l960.0 0l0 720.0l-960.0 0z" fill-rule="evenodd"/><path fill="#000000" d="m328.79355 432.82886l0 0c-56.877106 0 -102.98511 49.780273 -102.98511 111.18732c0 61.407104 46.108 111.18732 102.98511 111.18732l0 -51.492493c-28.438568 0 -51.492554 -26.726318 -51.492554 -59.694824c0 -32.968506 23.053986 -59.694763 51.492554 -59.694763z" fill-rule="evenodd"/><path fill="#000000" d="m140.32236 262.3746l189.53802 0l0 51.374786l-189.53802 0z" fill-rule="evenodd"/><path fill="#000000" d="m328.79355 262.3746l0 0c56.877075 0 102.98508 49.780273 102.98508 111.18732c0 61.407074 -46.108 111.18735 -102.98508 111.18735l0 -51.492554c28.438538 0 51.492523 -26.726257 51.492523 -59.694794c0 -32.968506 -23.053986 -59.694763 -51.492523 -59.694763z" fill-rule="evenodd"/><path fill="#000000" d="m329.0173 603.8287l441.39633 0l0 51.374817l-441.39633 0z" fill-rule="evenodd"/><path fill="#000000" d="m149.13191 91.3741l0 0c-56.877098 0 -102.98509 49.78026 -102.98509 111.18733c0 61.407043 46.107998 111.18732 102.98509 111.18732l0 -51.492554c-28.438553 0 -51.492554 -26.726257 -51.492554 -59.694763c0 -32.96852 23.054 -59.69478 51.492554 -59.69478z" fill-rule="evenodd"/><path fill="#000000" d="m148.5085 91.91903l621.9008 0l0 51.37478l-621.9008 0z" fill-rule="evenodd"/><path fill="#000000" d="m768.26404 91.37474l0 0c56.877075 0 102.98511 49.78026 102.98511 111.18732c0 61.40706 -46.108032 111.18733 -102.98511 111.18733l0 -51.492554c28.438538 0 51.492554 -26.726257 51.492554 -59.69478c0 -32.968506 -23.054016 -59.694763 -51.492554 -59.694763z" fill-rule="evenodd"/><path fill="#000000" d="m768.26404 262.1323l0 0c-56.877136 0 -102.98511 49.780273 -102.98511 111.18732c0 61.407074 46.10797 111.18732 102.98511 111.18732l0 -51.492523c-28.438538 0 -51.492554 -26.726288 -51.492554 -59.694794c0 -32.968506 23.054016 -59.694763 51.492554 -59.694763z" fill-rule="evenodd"/><path fill="#000000" d="m768.26404 655.2043l0 0c56.877075 0 102.98511 -49.780212 102.98511 -111.18732c0 -61.407043 -46.108032 -111.18732 -102.98511 -111.18732l0 51.492554c28.438538 0 51.492554 26.726257 51.492554 59.694763c0 32.968506 -23.054016 59.694763 -51.492554 59.694763z" fill-rule="evenodd"/><path fill="#4a86e8" d="m453.8294 93.49009l35.433075 0l0 49.79528l-35.433075 0z" fill-rule="evenodd"/><path fill="#ff0000" d="m605.7874 605.40875l35.433044 0l0 49.795227l-35.433044 0z" fill-rule="evenodd"/><path fill="#00ff00" d="m241.68242 263.66403l35.43306 0l0 49.795288l-35.43306 0z" fill-rule="evenodd"/><path fill="#ffff00" d="m318.00262 605.4094l35.433075 0l0 49.795288l-35.433075 0z" fill-rule="evenodd"/></g></svg>`
        }
    },


    // --- HARD CHALLENGES ---
    {
        id: 'c_maze_original',
        title: '13. The Great Maze',
        description: 'Navigate through the complex maze using the gaps in the internal walls to reach the green finish zone.',
        difficulty: 'Hard',
        check: (start, end, history) => end.x > 10 && end.z < -10 && !history.touchedWall,
        startPosition: { x: -16, y: 0, z: 12 },
        startRotation: 0,
        environmentObjects: [
            // Outer boundaries
            { "id": "m_w_top", "type": "WALL", "x": 0, "z": -15, "width": 40, "length": 0.5, "color": "#374151" },
            { "id": "m_w_bottom", "type": "WALL", "x": 0, "z": 15, "width": 40, "length": 0.5, "color": "#374151" },
            { "id": "m_w_left", "type": "WALL", "x": -20, "z": 0, "width": 0.5, "length": 30, "color": "#374151" },
            { "id": "m_w_right", "type": "WALL", "x": 20, "z": 0, "width": 0.5, "length": 30, "color": "#374151" },
            
            // Internal walls matching the provided image layout
            { "id": "m_w_internal_red", "type": "WALL", "x": -7, "z": 3, "width": 0.5, "length": 24, "color": "#ef4444" }, // Gap at top
            { "id": "m_w_internal_blue", "type": "WALL", "x": 7, "z": -3, "width": 0.5, "length": 24, "color": "#3b82f6" }, // Gap at bottom
            
            // Landmarks and Finish Zone
            { "id": "center_mark", "type": "COLOR_LINE", "x": 0, "z": 0, "width": 1.5, "length": 1.5, "color": "#ef4444", "opacity": 0.6 },
            { "id": "finish_zone", "type": "COLOR_LINE", "x": 14, "z": -12.5, "width": 10, "length": 5, "color": "#22c55e" }
        ]
    },
    {
        id: 'c12',
        title: '14. Line Following - Ellipse Track',
        description: 'Follow the black elliptical line for one full lap.',
        difficulty: 'Hard',
        check: (start, end, history) => history.maxDistanceMoved > 22 && history.detectedColors.includes('black'),
        startPosition: { x: 0, y: 0, z: -2 },
        startRotation: 0
    },
    {
        id: 'c21',
        title: '15. Line Following - Track Follower',
        description: 'Follow the circular black line.',
        difficulty: 'Hard',
        check: (start, end, history) => history.maxDistanceMoved > 11 && history.detectedColors.includes('black'),
        startPosition: { x: 0, y: 0, z: 0 },
        startRotation: 0
    },
    {
        id: 'c18',
        title: '16. Gyro - Auto Leveling',
        description: 'Climb a ramp, cross the platform, and descend safely.',
        difficulty: 'Hard',
        check: (start, end, history) => history.maxDistanceMoved > 14,
        startRotation: 0
    }
];
