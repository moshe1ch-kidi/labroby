
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
}

export const CHALLENGES: Challenge[] = [
    // --- EASY CHALLENGES ---
    {
        id: 'c_square_loop',
        title: 'Magic Square - Loops',
        description: 'Program the robot to drive on the yellow square track. Use the "repeat 4 times" block!',
        difficulty: 'Easy',
        check: (start, end, history) => end.x > 14 && end.z < 0,
        startPosition: { x: 0, y: 0, z: 0 },
        startRotation: 180,
        environmentObjects: [
            { "id": "obj_1", "type": "PATH", "shape": "STRAIGHT", "x": 11.45, "z": -3.13, "width": 2.8, "length": 20, "rotation": 1.56, "color": "#EAB308" },
            { "id": "obj_2", "type": "PATH", "shape": "STRAIGHT", "x": 0.08, "z": -14.58, "width": 2.8, "length": 20, "rotation": -3.14, "color": "#EAB308" },
            { "id": "obj_3", "type": "PATH", "shape": "CORNER", "x": 0.10, "z": -3.17, "width": 2.8, "length": 2.8, "rotation": 0.00, "color": "#EAB308" },
            { "id": "obj_4", "type": "PATH", "shape": "CORNER", "x": 0.06, "z": -25.92, "width": 2.8, "length": 2.8, "rotation": -1.55, "color": "#EAB308" },
            { "id": "obj_5", "type": "PATH", "shape": "CORNER", "x": 22.78, "z": -25.78, "width": 2.8, "length": 2.8, "rotation": 3.14, "color": "#EAB308" },
            { "id": "obj_6", "type": "PATH", "shape": "STRAIGHT", "x": 11.39, "z": -25.86, "width": 2.8, "length": 20, "rotation": 1.56, "color": "#EAB308" },
            { "id": "obj_7", "type": "PATH", "shape": "STRAIGHT", "x": 22.83, "z": -14.35, "width": 2.8, "length": 20, "rotation": 0.00, "color": "#EAB308" },
            { "id": "obj_8", "type": "PATH", "shape": "CORNER", "x": 22.83, "z": -3.03, "width": 2.8, "length": 2.8, "rotation": 1.56, "color": "#EAB308" }
        ]
    },
    {
        id: 'c2',
        title: 'Directions - Turn in Place',
        description: 'Perform a full 360-degree turn and return to the original direction.',
        difficulty: 'Easy',
        check: (start, end, history) => Math.abs(history.totalRotation) >= 350
    },
    {
        id: 'c3',
        title: 'Speed - Hill Climb',
        description: 'Drive at 100% speed for 2 meters and return at 20% speed.',
        difficulty: 'Easy',
        check: (start, end, history) => history.maxDistanceMoved >= 18
    },
    {
        id: 'c4',
        title: 'Speed - Emergency Brake',
        description: 'Drive fast and stop suddenly without sliding.',
        difficulty: 'Easy',
        check: (start, end, history) => history.maxDistanceMoved > 5 && !end.isMoving
    },
    {
        id: 'c6',
        title: 'Lights - Turn Signal',
        description: 'Activate an orange turn signal for 2 seconds before starting a turn.',
        difficulty: 'Easy',
        check: (start, end, history) => Math.abs(history.totalRotation) > 10 && (end.ledLeftColor !== 'black' || end.ledRightColor !== 'black')
    },

    // --- MEDIUM CHALLENGES ---
    {
        id: 'c9',
        title: 'Color ID - Multi-line Path',
        description: 'Drive along the path and identify 5 colored lines. The last line is a red stop line.',
        difficulty: 'Medium',
        check: (start, end, history) => {
            const requiredColors = ['magenta', 'cyan', 'yellow', 'green', 'red'];
            const foundCount = history.detectedColors.filter(c => requiredColors.includes(c.toLowerCase())).length;
            return end.z <= -14.8 && !end.isMoving && foundCount >= 4;
        },
        startPosition: { x: 0, y: 0, z: 0 },
        startRotation: 180,
        environmentObjects: [
            { id: 'line1', type: 'COLOR_LINE', x: 0, z: -3.0, width: 2.5, length: 0.1, color: '#EC4899' },
            { id: 'line2', type: 'COLOR_LINE', x: 0, z: -6.0, width: 2.5, length: 0.1, color: '#06B6D4' },
            { id: 'line3', type: 'COLOR_LINE', x: 0, z: -9.0, width: 2.5, length: 0.1, color: '#EAB308' },
            { id: 'line4', type: 'COLOR_LINE', x: 0, z: -12.0, width: 2.5, length: 0.1, color: '#22C55E' },
            { id: 'line5', type: 'COLOR_LINE', x: 0, z: -15.0, width: 2.5, length: 0.1, color: '#EF4444' }
        ]
    },
    {
        id: 'c_colored_cubes',
        title: 'קוביות צבעוניות',
        description: 'על הרובוט לזהות קוביות צבעוניות ולעקוף אותם , להיעצר על מלבן כחול הכחול בסוף.',
        difficulty: 'Medium',
        check: (start, end, history) => {
            const reachedEnd = end.z < -23;
            const stopped = !end.isMoving;
            const touched = history.touchedWall;
            const onBlue = history.detectedColors.some(c => c.toLowerCase().includes('blue') || c === '#3B82F6');
            return reachedEnd && stopped && !touched && onBlue;
        },
        startPosition: { x: 0, y: 0, z: 0 },
        startRotation: 180,
        environmentObjects: [
            { id: 'path_bg', type: 'PATH', shape: 'STRAIGHT', x: 0, z: -12.5, width: 5, length: 30, color: '#171717' }, 
            { id: 'cube_green', type: 'WALL', x: 0, z: -5, width: 1, length: 1, color: '#22C55E' },
            { id: 'cube_red', type: 'WALL', x: 0, z: -10, width: 1, length: 1, color: '#EF4444' },
            { id: 'cube_blue_obst', type: 'WALL', x: 0, z: -15, width: 1, length: 1, color: '#3B82F6' },
            { id: 'cube_yellow', type: 'WALL', x: 0, z: -20, width: 1, length: 1, color: '#EAB308' },
            { id: 'finish_line_blue', type: 'COLOR_LINE', x: 0, z: -24, width: 5, length: 2, color: '#3B82F6' }
        ]
    },
    {
        id: 'c1',
        title: 'Room Navigation - Wall Course',
        description: 'Go through the wall corridor and reach the green target area without touching obstacles.',
        difficulty: 'Medium',
        check: (start, end, history) => end.x > 14 && end.z < 0,
        startPosition: { x: 0.10, y: 0, z: 0.10 },
        startRotation: 180,
        environmentObjects: [
            { "id": "w1", "type": "WALL", "x": -2.19, "z": -6.15, "width": 0.5, "length": 12, "rotation": 3.12, "color": "#ef4444" },
            { "id": "w2", "type": "WALL", "x": 2.26, "z": -3.97, "width": 0.5, "length": 7.75, "rotation": 0.00, "color": "#ef4444" },
            { "id": "w3", "type": "WALL", "x": 5.50, "z": -7.93, "width": 0.5, "length": 6.95, "rotation": 1.58, "color": "#ef4444" },
            { "id": "w4", "type": "WALL", "x": 3.48, "z": -12.26, "width": 0.5, "length": 11.56, "rotation": -1.57, "color": "#ef4444" }
        ]
    },
    {
        id: 'c5',
        title: 'Traffic Light - Road Nav',
        description: 'Drive along the yellow road, turn right, and stop at the red line.',
        difficulty: 'Medium',
        check: (start, end, history) => end.x > 8 && end.z < -15,
        startPosition: { x: 0.00, y: 0, z: 0.00 },
        startRotation: 180,
        environmentObjects: [
            { "id": "p1", "type": "PATH", "shape": "STRAIGHT", "x": -0.03, "z": -8.67, "width": 2.8, "length": 14.01, "rotation": 3.13, "color": "#EAB308" },
            { "id": "p2", "type": "PATH", "shape": "CORNER", "x": 0.00, "z": -16.67, "width": 2.8, "length": 2.8, "rotation": -1.56, "color": "#EAB308" },
            { "id": "p3", "type": "PATH", "shape": "STRAIGHT", "x": 4.77, "z": -16.65, "width": 2.8, "length": 6.92, "rotation": 1.56, "color": "#EAB308" },
            { "id": "l1", "type": "COLOR_LINE", "x": 8.99, "z": -16.62, "width": 2.8, "length": 1.67, "rotation": 1.56, "color": "#EF4444" }
        ]
    },
    {
        id: 'c7',
        title: 'Slalom - Obstacle Course',
        description: 'Navigate around 4 colored obstacles and reach the end of the track.',
        difficulty: 'Medium',
        check: (start, end, history) => end.z > 22 && !history.touchedWall,
        startPosition: { x: 0, y: 0, z: 0 },
        environmentObjects: [
            { "id": "sl1", "type": "WALL", "x": 0, "z": 5, "width": 0.5, "length": 2, "color": "#ef4444" },
            { "id": "sl2", "type": "WALL", "x": 0, "z": 10, "width": 0.5, "length": 2, "color": "#3b82f6" },
            { "id": "sl3", "type": "WALL", "x": 0, "z": 15, "width": 0.5, "length": 2, "color": "#22c55e" },
            { "id": "sl4", "type": "WALL", "x": 0, "z": 20, "width": 0.5, "length": 2, "color": "#EAB308" }
        ]
    },
    {
        id: 'c10',
        title: 'Touch Sensor - Obstacle Retreat',
        description: 'Drive until you hit the wall. After touching it, drive backward to the green line.',
        difficulty: 'Medium',
        check: (start, end, history) => history.touchedWall && history.detectedColors.includes('green'),
        environmentObjects: [
            { id: 'w_hit', type: 'WALL', x: 0, z: -10, width: 6, length: 0.5, color: '#EF4444' },
            { id: 'l_green', type: 'COLOR_LINE', x: 0, z: 0.5, width: 2.5, length: 0.5, color: '#22c55e' }
        ]
    },
    {
        id: 'c10_lines',
        title: 'Sensors - Line Counting',
        description: 'Count 5 black lines and stop at the red line.',
        difficulty: 'Medium',
        check: (start, end, history) => history.detectedColors.filter(c => c === 'black').length >= 4 && history.detectedColors.includes('red'),
        environmentObjects: [
            { id: 'l1', type: 'COLOR_LINE', x: 0, z: -2, width: 2.5, length: 0.1, color: '#000000' },
            { id: 'l2', type: 'COLOR_LINE', x: 0, z: -4, width: 2.5, length: 0.1, color: '#000000' },
            { id: 'l3', type: 'COLOR_LINE', x: 0, z: -6, width: 2.5, length: 0.1, color: '#000000' },
            { id: 'l4', type: 'COLOR_LINE', x: 0, z: -8, width: 2.5, length: 0.1, color: '#000000' },
            { id: 'l5', type: 'COLOR_LINE', x: 0, z: -10, width: 2.5, length: 0.1, color: '#000000' },
            { id: 'l_stop', type: 'COLOR_LINE', x: 0, z: -15, width: 2.5, length: 1, color: '#EF4444' }
        ]
    },
    {
        id: 'c_winding_path',
        title: 'הדרך המתפתלת',
        description: 'על הרובוט לעקוב אחרי השביל הצהוב, לעבור מעל רמפה, ולהיעצר על הריבוע הכחול בסוף.',
        difficulty: 'Medium',
        check: (start, end, history) => {
            const onBlueSquare = end.z < -16 && Math.abs(end.x) < 2;
            const stopped = !end.isMoving;
            const detectedBlue = history.detectedColors.includes('blue');
            return onBlueSquare && stopped && detectedBlue;
        },
        startPosition: { x: 0, y: 0, z: 0 },
        startRotation: 180,
        environmentObjects: [
            { "id": "path_1", "type": "PATH", "shape": "STRAIGHT", "x": 0, "z": -5, "width": 2.8, "length": 10, "rotation": 0, "color": "#EAB308" },
            { "id": "ramp_1", "type": "RAMP", "x": 0, "z": -13, "width": 2.8, "length": 6, "height": 1, "color": "#334155" },
            { "id": "finish_zone", "type": "COLOR_LINE", "x": 0, "z": -17.4, "width": 2.8, "length": 2.8, "rotation": 0, "color": "#3B82F6" },
            { "id": "wall_1", "type": "WALL", "x": 5, "z": -10, "width": 0.5, "length": 20, "rotation": 0, "color": "#EF4444" }
        ]
    },
    {
        id: 'c_snake_path',
        title: 'שביל הנחש',
        description: 'מסלול אליפסה שחור עם 4 צבעים: כחול, ירוק, צהוב, ואדום.',
        difficulty: 'Medium',
        check: (start, end, history) => {
            // Target: Red Marker
            const onRed = history.detectedColors.some(c => c.toLowerCase().includes('red') || c === '#FF0000');
            const stopped = !end.isMoving;
            
            const detectedBlue = history.detectedColors.some(c => c.toLowerCase().includes('blue') || c === '#0000FF');
            const detectedGreen = history.detectedColors.some(c => c.toLowerCase().includes('green') || c === '#22C55E');
            const detectedYellow = history.detectedColors.some(c => c.toLowerCase().includes('yellow') || c === '#FFFF00');

            return onRed && stopped && detectedGreen && detectedYellow && detectedBlue;
        },
        // Start on the Red Square (Start Marker) which is at 0,0,0
        startPosition: { x: 0, y: 0, z: 0 },
        startRotation: 90,
        environmentObjects: [] // Handled by isEllipseTrack logic in Environment.tsx
    },


    // --- HARD CHALLENGES ---
    {
        id: 'c_maze_original',
        title: 'The Updated Code Maze',
        description: 'Navigate the maze and reach the green finish line.',
        difficulty: 'Hard',
        check: (start, end, history) => end.x > 14 && end.z < 0 && !history.touchedWall,
        startPosition: { x: -18.00, y: 0, z: 0.00 },
        startRotation: 90,
        environmentObjects: [
            { "id": "m_w_top", "type": "WALL", "x": 0, "z": -15, "width": 30, "length": 0.5, "color": "#374151" },
            { "id": "m_w_bottom", "type": "WALL", "x": 0, "z": 15, "width": 30, "length": 0.5, "color": "#374151" },
            { "id": "m_w_left_t", "type": "WALL", "x": -15, "z": -10, "width": 0.5, "length": 10, "color": "#374151" },
            { "id": "m_w_left_b", "type": "WALL", "x": -15, "z": 10, "width": 0.5, "length": 10, "color": "#374151" },
            { "id": "m_w_right_t", "type": "WALL", "x": 15, "z": -12.5, "width": 0.5, "length": 5, "color": "#374151" },
            { "id": "m_w_right_b", "type": "WALL", "x": 15, "z": 5, "width": 0.5, "length": 20, "color": "#374151" },
            { "id": "finish_line", "type": "COLOR_LINE", "x": 16, "z": -7.5, "width": 3, "length": 5, "color": "#22c55e" }
        ]
    },
    {
        id: 'c12',
        title: 'Line Following - Ellipse Track',
        description: 'Follow the black elliptical line for one full lap.',
        difficulty: 'Hard',
        check: (start, end, history) => history.maxDistanceMoved > 22 && history.detectedColors.includes('black'),
        startPosition: { x: 0, y: 0, z: -2 },
        startRotation: 90
    },
    {
        id: 'c21',
        title: 'Line Following - Track Follower',
        description: 'Follow the circular black line.',
        difficulty: 'Hard',
        check: (start, end, history) => history.maxDistanceMoved > 11 && history.detectedColors.includes('black'),
        startPosition: { x: 0, y: 0, z: 0 },
        startRotation: 180
    },
    {
        id: 'c18',
        title: 'Gyro - Auto Leveling',
        description: 'Climb a ramp, cross the platform, and descend safely.',
        difficulty: 'Hard',
        check: (start, end, history) => history.maxDistanceMoved > 14
    }
];
