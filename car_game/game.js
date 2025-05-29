let scene, camera, renderer, car, road;
let aiCars = [];  // Array to store AI cars
const NUM_AI_CARS = 6;  // Reduced from 10 to 6
const AI_CAR_SPEEDS = [0.05, 0.08, 0.1, 0.12, 0.15];  // Speeds for AI cars
// Separate lanes for each direction with center lanes
const LEFT_LANES = [-10, -6, -2];   // Added center-left lane
const RIGHT_LANES = [2, 6, 10];    // Added center-right lane

let score = 0;
let speed = 0;
const maxSpeed = 260;  // Increased from 120 to 150
const acceleration = 0.5;  // Increased from 2 to 4
const deceleration = 0.8;  // Decreased from 1 to 0.8
const brakeForce = 6;  // Increased from 5 to 6
let isAccelerating = false;
let isBraking = false;
let isMovingLeft = false;
let isMovingRight = false;

// Add new variables for effects
let roadStripes = [];
let trees = [];
let lights = [];
const NUM_STRIPES = 20;
const NUM_TREES = 30;  // Reduced from 50 to 30
const NUM_LIGHTS = 20;

// Add camera dynamics variables
let cameraBaseHeight = 2.5;
let cameraBaseDistance = 4;
let cameraTilt = 0;

// Add new constants for AI car behavior
const AI_LANE_CHANGE_CHANCE = 0.005;  // Probability of lane change per frame
const AI_MIN_LANE_CHANGE_DISTANCE = 20;  // Minimum distance between lane changes
const AI_SPEED_VARIATION = 0.02;  // Speed variation per frame
const AI_MAX_SPEED_CHANGE = 0.05;  // Maximum speed change
const AI_MIN_SPEED = 0.05;  // Minimum AI car speed
const AI_MAX_SPEED = 0.2;   // Maximum AI car speed

// Add new constants for improved AI behavior
const AI_SAFE_DISTANCE = 10;  // Minimum safe distance between cars
const AI_LANE_CHANGE_DISTANCE = 15;  // Distance to check for lane change
const AI_SPEED_MATCH_FACTOR = 0.1;  // How quickly to match speed with cars ahead
const AI_PREFERRED_SPEEDS = {
  SLOW: 0.08,
  NORMAL: 0.50,
  FAST: 0.50
};

// Add buildings array
let buildings = [];
const NUM_BUILDINGS = 20;  // Reduced from 30 to 20
const BUILDING_SPACING = 100;  // Consistent spacing between buildings
const BUILDING_RECYCLE_DISTANCE = 150;  // Distance at which buildings get recycled

// Add infinite environment settings
const INFINITE_LENGTH = 1000000;
const SEGMENT_LENGTH = 2000;
const VISIBLE_DISTANCE = 3000;

// Add center line array to store segments
let centerLineSegments = [];
const NUM_CENTER_SEGMENTS = 30;  // Reduced from 40 to 30
const CENTER_SEGMENT_LENGTH = 50;  // Shorter segments for smoother recycling

// Add weather and atmosphere variables
let rainParticles = [];
let lightningFlash;
let cloudParticles = [];
const NUM_RAIN_DROPS = 800;  // Reduced from 1500 to 800
const NUM_CLOUDS = 50;  // Reduced from 100 to 50
let weatherState = 'clear';  // can be 'clear', 'heavyRain', or 'storm'
let weatherIntensity = 0;
let lastWeatherChange = 0;
let lastLightningTime = 0;
const WEATHER_CHANGE_INTERVAL = 300;

// Add dynamic day/night cycle with enhanced atmosphere
let time = 0;
let skyColor = new THREE.Color();
let sunLight;

// Add variables for smooth lateral movement
let lateralSpeed = 0;
const MAX_LATERAL_SPEED = 0.5;  // Increased from 0.25 to 0.5
const LATERAL_ACCELERATION = 0.03;  // Doubled from 0.015 to 0.03
const LATERAL_DECELERATION = 0.03;  // Increased from 0.02 to 0.03
const MAX_TILT_ANGLE = 0.2;  // Increased from 0.15 to 0.2 for better visual feedback

// Add collision variables and basic collision handling functions
let isInCollision = false;
let collisionTimeout = null;
const COLLISION_RECOVERY_TIME = 1000; // 1 second
const COLLISION_FORCE_THRESHOLD = 3;

// Add variables for car parts
let carParts = [];
let brokenParts = [];

// Add health variables
let carHealth = 100;
const MAX_HEALTH = 100;

// Add speedometer elements
let speedIndicator = null;
let speedValue = null;

function createTree(side, zPosition) {
  const treeGeometry = new THREE.ConeGeometry(1.5, 4, 6);  // Reduced segments from 8 to 6
  const treeMaterial = new THREE.MeshBasicMaterial({ color: 0x228B22 });  // Use BasicMaterial instead of StandardMaterial
  const trunkGeometry = new THREE.CylinderGeometry(0.2, 0.3, 1.5, 6);  // Reduced segments
  const trunkMaterial = new THREE.MeshBasicMaterial({ color: 0x8B4513 });

  const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
  const leaves = new THREE.Mesh(treeGeometry, treeMaterial);
  
  trunk.position.y = 0.75;
  leaves.position.y = 3;

  const tree = new THREE.Group();
  tree.add(trunk);
  tree.add(leaves);

  tree.position.x = side * (16 + Math.random() * 2);
  tree.position.y = 0;
  tree.position.z = zPosition;

  tree.rotation.y = Math.random() * Math.PI * 2;
  const scale = 0.8 + Math.random() * 0.4;
  tree.scale.set(scale, scale, scale);

  tree.traverse(child => {
    if (child instanceof THREE.Mesh) {
      child.castShadow = true;
      child.receiveShadow = true;
    }
  });

  return tree;
}

function createBuilding(side, zPosition) {
  // Randomize building dimensions
  const width = 5 + Math.random() * 3;      // Width: 5-8 units
  const height = 8 + Math.random() * 12;    // Height: 8-20 units
  const depth = 5 + Math.random() * 3;      // Depth: 5-8 units

  // Create main building structure
  const buildingGeometry = new THREE.BoxGeometry(width, height, depth);
  const buildingMaterial = new THREE.MeshPhongMaterial({
    color: new THREE.Color(
      0.3 + Math.random() * 0.2,
      0.3 + Math.random() * 0.2,
      0.4 + Math.random() * 0.2
    ),
    shininess: 30
  });
  const building = new THREE.Mesh(buildingGeometry, buildingMaterial);

  // Add foundation
  const foundationGeometry = new THREE.BoxGeometry(width + 0.2, 0.1, depth + 0.2);
  const foundationMaterial = new THREE.MeshPhongMaterial({
    color: 0x333333,
    shininess: 10
  });
  const foundation = new THREE.Mesh(foundationGeometry, foundationMaterial);
  foundation.position.y = -height/2;
  building.add(foundation);

  // Add windows
  const windowSize = 0.8;
  const windowGeometry = new THREE.PlaneGeometry(windowSize, windowSize);
  const windowMaterial = new THREE.MeshPhongMaterial({
    color: 0xffffff,
    emissive: 0xffffbb,
    emissiveIntensity: 0.2,
    transparent: true,
    opacity: 0.9
  });

  const windowSpacingH = 1.5;
  const windowSpacingV = 2;
  const numWindowsH = Math.floor(width / windowSpacingH) - 1;
  const numWindowsV = Math.floor(height / windowSpacingV) - 1;

  // Add windows to front and back
  for (let side of [-1, 1]) {
    for (let i = 0; i < numWindowsV; i++) {
      for (let j = 0; j < numWindowsH; j++) {
        const window = new THREE.Mesh(windowGeometry, windowMaterial.clone());
        window.position.set(
          -width/2 + windowSpacingH + j * windowSpacingH,
          -height/2 + windowSpacingV + i * windowSpacingV,
          side * (depth/2 + 0.1)
        );
        if (side === -1) window.rotation.y = Math.PI;
        building.add(window);
      }
    }
  }

  // Position building
  building.position.y = height/2;
  building.position.x = side * (20 + Math.random() * 3);
  building.position.z = zPosition;

  // Add slight random rotation for variety
  building.rotation.y = (Math.random() - 0.5) * 0.2;

  // Optimize performance by disabling shadows
  building.castShadow = false;
  building.receiveShadow = false;
  building.traverse(child => {
    if (child instanceof THREE.Mesh) {
      child.castShadow = false;
      child.receiveShadow = false;
    }
  });

  // Store original dimensions for recycling
  building.userData = {
    width: width,
    height: height,
    depth: depth,
    originalX: building.position.x
  };

  scene.add(building);
  return building;
}

function initBuildings() {
  // Clear existing buildings
  buildings.forEach(building => scene.remove(building));
  buildings = [];

  // Create initial set of buildings
  const totalDistance = NUM_BUILDINGS * BUILDING_SPACING;
  for (let i = 0; i < NUM_BUILDINGS; i++) {
    const zOffset = (Math.random() - 0.5) * (BUILDING_SPACING * 0.3); // Add some randomness to spacing
    const leftBuilding = createBuilding(-1, -i * BUILDING_SPACING + zOffset);
    const rightBuilding = createBuilding(1, -i * BUILDING_SPACING - zOffset);
    buildings.push(leftBuilding, rightBuilding);
  }
}

function updateBuildings() {
  if (!car) return;

  buildings.forEach((building, index) => {
    if (!building || !building.position) return;
    
    // Calculate relative position to player
    const relativeZ = building.position.z - car.position.z;
    
    // Recycle building when it's too far behind
    if (relativeZ > BUILDING_RECYCLE_DISTANCE) {
      // Find the furthest building ahead
      let minZ = Infinity;
      buildings.forEach(b => {
        if (b && b.position && b.position.z < minZ) {
          minZ = b.position.z;
        }
      });
      
      // Place building ahead with some randomization
      const side = building.position.x > 0 ? 1 : -1;
      const newZ = minZ - BUILDING_SPACING + (Math.random() - 0.5) * (BUILDING_SPACING * 0.3);
      
      // Randomize building appearance
      const scaleVariation = 0.8 + Math.random() * 0.4;
      building.scale.set(scaleVariation, scaleVariation, scaleVariation);
      building.position.z = newZ;
      building.position.x = side * (20 + Math.random() * 3);
      building.rotation.y = (Math.random() - 0.5) * 0.2;
      
      // Update window lights randomly
      building.traverse(child => {
        if (child instanceof THREE.Mesh && child.material.emissive) {
          child.material.emissiveIntensity = 0.1 + Math.random() * 0.3;
        }
      });
    }
  });
}

function createRoadShoulder(side) {
  // Create a group to hold shoulder components
  const shoulderGroup = new THREE.Group();

  // Main shoulder slope
  const slopeGeometry = new THREE.PlaneGeometry(8, 1000);  // 8 units wide slope
  const slopeMaterial = new THREE.MeshStandardMaterial({
    color: 0x333333,  // Darker than road, lighter than grass
    roughness: 0.8,
    metalness: 0.1
  });
  const slope = new THREE.Mesh(slopeGeometry, slopeMaterial);
  slope.rotation.x = -Math.PI / 2;
  slope.rotation.z = side * Math.PI / 24;  // ~7.5 degree slope
  slope.position.x = side * 19;  // Position next to road edge
  slope.position.y = -0.2;  // Slightly below road surface
  shoulderGroup.add(slope);

  // Grass transition
  const grassTransitionGeometry = new THREE.PlaneGeometry(15, 1000);
  const grassTransitionMaterial = new THREE.MeshStandardMaterial({
    color: 0x2d5a27,  // Slightly darker grass color
    roughness: 1,
    metalness: 0
  });
  const grassTransition = new THREE.Mesh(grassTransitionGeometry, grassTransitionMaterial);
  grassTransition.rotation.x = -Math.PI / 2;
  grassTransition.rotation.z = side * Math.PI / 48;  // Gentler slope (~3.75 degrees)
  grassTransition.position.x = side * 30;  // Outside of shoulder slope
  grassTransition.position.y = -0.4;  // Below shoulder slope
  shoulderGroup.add(grassTransition);

  return shoulderGroup;
}

// Initialize the game
function init() {
  // Create scene
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x000000);  // Black background

  // Create and position camera with much larger view distance
  camera = new THREE.PerspectiveCamera(
    60,
    window.innerWidth / window.innerHeight,
    0.1,
    5000  // Reduced from 10000 to 5000
  );
  camera.position.set(0, 2.5, 4);
  camera.lookAt(0, 0.5, 0);

  // Create renderer with better depth settings
  renderer = new THREE.WebGLRenderer({ 
    canvas: document.getElementById('gameCanvas'), 
    antialias: false,  // Disable antialiasing for better performance
    precision: 'mediump',  // Use medium precision for better performance
    powerPreference: 'high-performance'
  });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.shadowMap.enabled = false;  // Disable shadows for better performance

  // Create larger ground and road
  const groundGeometry = new THREE.PlaneGeometry(500, 10000);  // Increased length
  const groundMaterial = new THREE.MeshStandardMaterial({
    color: 0x2d5a27,
    roughness: 1,
    metalness: 0
  });
  const ground = new THREE.Mesh(groundGeometry, groundMaterial);
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -0.6;
  ground.receiveShadow = true;
  scene.add(ground);

  // Create longer road
  const roadGeometry = new THREE.PlaneGeometry(30, 10000);  // Increased length
  const roadMaterial = new THREE.MeshStandardMaterial({ 
    color: 0x1a1a1a,
    roughness: 0.7,
    metalness: 0.1
  });
  road = new THREE.Mesh(roadGeometry, roadMaterial);
  road.rotation.x = -Math.PI / 2;
  road.position.y = -0.5;
  road.receiveShadow = true;
  scene.add(road);

  // Enhance lighting for better distance visibility
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
  scene.add(ambientLight);

  const sunLight = new THREE.DirectionalLight(0xffffff, 1);
  sunLight.position.set(50, 100, 50);
  sunLight.castShadow = true;
  sunLight.shadow.mapSize.width = 2048;
  sunLight.shadow.mapSize.height = 2048;
  sunLight.shadow.camera.near = 0.5;
  sunLight.shadow.camera.far = 10000;  // Increased shadow distance
  sunLight.shadow.camera.left = -500;
  sunLight.shadow.camera.right = 500;
  sunLight.shadow.camera.top = 500;
  sunLight.shadow.camera.bottom = -500;
  scene.add(sunLight);

  // Load Scorpio car model from jsDelivr
  const loader = new THREE.GLTFLoader();
  loader.load(
    'https://cdn.jsdelivr.net/gh/Deepanshu664/scorpio-model/scrpio_compressed.glb',  // ✅ Compressed Scorpio model
    function (gltf) {
      car = gltf.scene;

      // Scale and position the model
      car.scale.set(2.2, 2.2, 2.0);  // Increased from (1.5, 1.5, 1.3) to (2.2, 2.2, 2.0)
      car.position.set(0, 0.6, -2);  // Raised Y position from 0.4 to 0.6 to account for larger size
      car.rotation.y = 0;  // Make car face forward (away from camera)
      car.rotation.z = 0;
      car.rotation.x = 0;

      // Add this to ensure proper positioning
      car.updateMatrix();
      car.updateMatrixWorld();

      car.traverse((child) => {
        if (child.isMesh) {
          child.castShadow = true;
          child.receiveShadow = true;
          // Make materials more visible
          if (child.material) {
            child.material.metalness = 0.5;
            child.material.roughness = 0.5;
          }
        }
      });

      scene.add(car);
    },
    function (xhr) {
      console.log((xhr.loaded / xhr.total * 100) + '% loaded');
    },
    function (error) {
      console.error('An error happened:', error);
      const carGeometry = new THREE.BoxGeometry(1.2, 0.8, 2.2);
      const carMaterial = new THREE.MeshPhongMaterial({ 
        color: 0x1a1a1a,
        specular: 0x333333,
        shininess: 30 
      });
      car = new THREE.Mesh(carGeometry, carMaterial);
      car.position.y = 0.4;  // Also adjust fallback car's Y position to match
      scene.add(car);
    }
  );

  // Create center line with adjusted position
  const centerLineGeometry = new THREE.PlaneGeometry(0.3, 1000);
  const whiteLineMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });  // White color
  const centerLine = new THREE.Mesh(centerLineGeometry, whiteLineMaterial);
  centerLine.rotation.x = -Math.PI / 2;
  centerLine.position.y = 0.01;
  scene.add(centerLine);

  // Update lane markers for wider road - only inner lane dividers
  const createDashedLine = (xPos) => {
    const dashLength = 5;
    const gapLength = 5;
    const totalLength = INFINITE_LENGTH;
    const visibleDashes = Math.ceil(VISIBLE_DISTANCE / (dashLength + gapLength));
    
    for (let i = 0; i < visibleDashes; i++) {
      const dashGeometry = new THREE.PlaneGeometry(0.15, dashLength);
      const dash = new THREE.Mesh(dashGeometry, whiteLineMaterial);  // Using same white material
      dash.rotation.x = -Math.PI / 2;
      dash.position.x = xPos;
      dash.position.y = 0.01;
      dash.position.z = -i * (dashLength + gapLength);
      scene.add(dash);
    }
  };

  // Create dashed lines for lane separation - only inner lanes
  createDashedLine(-8);  // Between left lanes
  createDashedLine(8);   // Between right lanes

  document.getElementById('accelerate').addEventListener('mousedown', () => isAccelerating = true);
  document.getElementById('accelerate').addEventListener('mouseup', () => isAccelerating = false);
  document.getElementById('brake').addEventListener('mousedown', () => isBraking = true);
  document.getElementById('brake').addEventListener('mouseup', () => isBraking = false);
  document.getElementById('leftBtn').addEventListener('mousedown', () => isMovingLeft = true);
  document.getElementById('leftBtn').addEventListener('mouseup', () => isMovingLeft = false);
  document.getElementById('rightBtn').addEventListener('mousedown', () => isMovingRight = true);
  document.getElementById('rightBtn').addEventListener('mouseup', () => isMovingRight = false);

  document.addEventListener('keydown', handleKeyDown);
  document.addEventListener('keyup', handleKeyUp);

  animate();

  // Initialize AI cars
  initAICars();
  
  // Add center line
  createCenterLine();

  // Add street lights
  const lightGeometry = new THREE.CylinderGeometry(0.1, 0.1, 5);
  const lightMaterial = new THREE.MeshStandardMaterial({ color: 0x888888 });
  const lampGeometry = new THREE.ConeGeometry(0.5, 1, 8);
  const lampMaterial = new THREE.MeshStandardMaterial({ 
    color: 0xffff00,
    emissive: 0xffff00,
    emissiveIntensity: 0.5
  });

  for (let i = 0; i < NUM_LIGHTS; i++) {
    const pole = new THREE.Mesh(lightGeometry, lightMaterial);
    const lamp = new THREE.Mesh(lampGeometry, lampMaterial);
    
    pole.position.y = 2.5;
    lamp.position.y = 5;
    lamp.rotation.x = Math.PI;

    const lightGroup = new THREE.Group();
    lightGroup.add(pole);
    lightGroup.add(lamp);

    // Add point light
    const pointLight = new THREE.PointLight(0xffff00, 0.8, 10);
    pointLight.position.y = 5;
    lightGroup.add(pointLight);

    // Position alternating on left and right sides
    lightGroup.position.x = i % 2 === 0 ? -14 : 14;
    lightGroup.position.z = -i * 30;
    
    lights.push(lightGroup);
    scene.add(lightGroup);
  }

  // Add trees along the road
  initTrees();

  // Initialize buildings after scene is ready
  initBuildings();

  // Initialize atmosphere after scene creation
  initAtmosphere();

  // Create health bar
  createHealthBar();

  // Initialize speedometer elements
  speedIndicator = document.querySelector('.speed-indicator');
  speedValue = document.querySelector('#speedValue');

  if (!speedIndicator || !speedValue) {
    console.warn('Speedometer elements not found, creating them...');
    
    // Create speedometer if it doesn't exist
    // const speedometerHTML = `
    //     <div class="speedometer">
    //         <div class="speedometer-outer">
    //             <div class="speed-marks">
    //                 <div class="speed-mark mark-0"><span>0</span></div>
    //                 <div class="speed-mark mark-20"><span>20</span></div>
    //                 <div class="speed-mark mark-40"><span>40</span></div>
    //                 <div class="speed-mark mark-60"><span>60</span></div>
    //                 <div class="speed-mark mark-80"><span>80</span></div>
    //                 <div class="speed-mark mark-100"><span>100</span></div>
    //                 <div class="speed-mark mark-120"><span>120</span></div>
    //                 <div class="speed-mark mark-135"><span>140</span></div>
    //                 <div class="speed-mark mark-160"><span>160</span></div>
    //                 <div class="speed-mark mark-180"><span>180</span></div>
    //                 <div class="speed-mark mark-200"><span>200</span></div>
    //                 <div class="speed-mark mark-220"><span>220</span></div>
    //                 <div class="speed-mark mark-240"><span>240</span></div>
    //                 <div class="speed-mark mark-260"><span>260</span></div>
    //             </div>
    //             <div class="speed-marks-small"></div>
    //             <div class="speed-indicator">
    //                 <div class="needle-base"></div>
    //             </div>
    //             <div class="speedometer-center">
    //                 <div class="speed-value" id="speedValue">0</div>
    //                 <div class="speed-unit">km/h</div>
    //             </div>
    //         </div>`;

    // Create container for speedometer
    const speedContainer = document.createElement('div');
    speedContainer.style.cssText = 'position: fixed; bottom: 20px; right: 20px; z-index: 1000;';
    speedContainer.innerHTML = speedometerHTML;
    document.body.appendChild(speedContainer);

    // Re-query the elements after creating them
    speedIndicator = document.querySelector('.speed-indicator');
    speedValue = document.querySelector('#speedValue');
  }
}

function handleKeyDown(event) {
  switch(event.key) {
    case 'ArrowUp': isAccelerating = true; break;
    case 'ArrowDown': isBraking = true; break;
    case 'ArrowLeft': isMovingLeft = true; break;
    case 'ArrowRight': isMovingRight = true; break;
  }
}

function handleKeyUp(event) {
  switch(event.key) {
    case 'ArrowUp': isAccelerating = false; break;
    case 'ArrowDown': isBraking = false; break;
    case 'ArrowLeft': isMovingLeft = false; break;
    case 'ArrowRight': isMovingRight = false; break;
  }
}

function updateCameraView() {
  if (!car) return;

  // Dynamic camera height based on speed
  const heightFactor = Math.min(1, speed / maxSpeed);
  const targetHeight = cameraBaseHeight + (heightFactor * 1);
  camera.position.y += (targetHeight - camera.position.y) * 0.1;

  // Camera tilt effect during turns
  if (isMovingLeft) {
    cameraTilt = Math.max(cameraTilt - 0.02, -0.1);
  } else if (isMovingRight) {
    cameraTilt = Math.min(cameraTilt + 0.02, 0.1);
  } else {
    cameraTilt *= 0.95; // Return to center
  }

  camera.rotation.z = cameraTilt;
}

function updateGame() {
    // Don't process input during collision
    if (!isInCollision) {
        if (isAccelerating && speed < maxSpeed) {
            speed += acceleration * 1.2;  // Added multiplier for faster acceleration
        } else if (isBraking && speed > 0) {
            speed -= brakeForce * 1.1;  // Added multiplier for stronger braking
        } else if (speed > 0) {
            speed -= deceleration * 0.8;  // Reduced deceleration for smoother slowdown
        }
        speed = Math.max(0, Math.min(maxSpeed, speed));
    } else {
        // Slow down during collision
        speed *= 0.95;
    }

    if (speed > 0) score += Math.floor(speed / 20);

    // Update car and environment
    if (car) {
        car.position.z -= speed / 50;

        // Update lateral movement with smooth acceleration/deceleration
        if (!isInCollision) {
            if (isMovingLeft) {
                lateralSpeed = Math.max(lateralSpeed - LATERAL_ACCELERATION, -MAX_LATERAL_SPEED);
            } else if (isMovingRight) {
                lateralSpeed = Math.min(lateralSpeed + LATERAL_ACCELERATION, MAX_LATERAL_SPEED);
            } else {
                // Apply deceleration when no input
                if (lateralSpeed > 0) {
                    lateralSpeed = Math.max(0, lateralSpeed - LATERAL_DECELERATION);
                } else if (lateralSpeed < 0) {
                    lateralSpeed = Math.min(0, lateralSpeed + LATERAL_DECELERATION);
                }
            }
        } else {
            // Reduce lateral speed during collision
            lateralSpeed *= 0.9;
        }

        // Apply lateral movement with bounds checking
        const newX = car.position.x + lateralSpeed;
        if (newX >= -12 && newX <= 12) {
            car.position.x = newX;
        } else {
            lateralSpeed = 0;
        }

        // Calculate tilt based on lateral speed (only if not in collision)
        if (!isInCollision) {
            const tiltFactor = (lateralSpeed / MAX_LATERAL_SPEED) * MAX_TILT_ANGLE;
            car.rotation.z = -tiltFactor;
            car.rotation.y = -tiltFactor;
        }

        // Update environment
        updateCenterLine();
        const segmentIndex = Math.floor(Math.abs(car.position.z) / SEGMENT_LENGTH);
        road.position.z = -segmentIndex * SEGMENT_LENGTH;
        
        const ground = scene.children.find(child => 
            child instanceof THREE.Mesh && 
            child.material.color.getHex() === 0x2d5a27
        );
        if (ground) {
            ground.position.z = road.position.z;
        }

        // Update scene elements
        updateBuildings();
        updateTrees();
        updateAICars();

        // Camera follow
        const cameraHeight = 3.0;
        const cameraDistance = 6.0;
        const lookAheadDistance = 2.0;
        const cameraLag = 0.1;

        const targetCameraX = car.position.x;
        camera.position.x += (targetCameraX - camera.position.x) * cameraLag;
        camera.position.y = cameraHeight;
        camera.position.z = car.position.z + cameraDistance;

        const lookAtPoint = new THREE.Vector3(
            car.position.x,
            0.5,
            car.position.z - lookAheadDistance
        );
        camera.lookAt(lookAtPoint);

        // Check for collisions
        checkCollisions();
    }

    // Update UI
    const displaySpeed = Math.floor(speed);
    document.getElementById('speedValue').textContent = displaySpeed;
    document.getElementById('scoreValue').textContent = score;

    // Update speedometer
    updateSpeedometer();

    // Slowly regenerate health when not in collision
    if (!isInCollision && carHealth < MAX_HEALTH) {
        carHealth = Math.min(MAX_HEALTH, carHealth + 0.05);
        updateHealthBar();
    }
}

function animate() {
  requestAnimationFrame(animate);
  
  // Only update if tab is visible
  if (document.hidden) return;
  
  // Update game state
  updateGame();
  
  // Only update atmosphere effects every other frame
  if (performance.now() % 2 === 0) {
  updateAtmosphere();
  }
  
  updateBrokenParts();  // Add this line
  
  renderer.render(scene, camera);
}

function createAICar(zPosition, isLeftSide) {
    const loader = new THREE.GLTFLoader();
    const lanes = isLeftSide ? LEFT_LANES : RIGHT_LANES;
    const laneIndex = Math.floor(Math.random() * lanes.length);
    const xPosition = lanes[laneIndex];
    
    // Assign a preferred speed based on lane
    const preferredSpeed = laneIndex === 0 ? AI_PREFERRED_SPEEDS.NORMAL : AI_PREFERRED_SPEEDS.FAST;

    loader.load(
        'https://cdn.jsdelivr.net/gh/Deepanshu664/scorpio-model/jdm_experimental_sportcar_90_-_low_poly_model%20(1).glb',
        
        function (gltf) {
            const aiCar = gltf.scene;
            
            // Set scale to match player car (2.2, 2.2, 2.0)
            aiCar.scale.set(1.8, 1.8, 1.6);  // Slightly smaller than player car for better gameplay
            aiCar.position.set(xPosition, -0.3, zPosition);
            
            // Set 90-degree rotation based on direction
            if (isLeftSide) {
                // Cars moving left side
                aiCar.rotation.set(0, -Math.PI/2, 0);  // 90 degrees
            } else {
                // Cars moving right side
                aiCar.rotation.set(0, Math.PI/2, 0);  // -90 degrees
            }

            // Improve material and shadows
            aiCar.traverse((child) => {
                if (child.isMesh) {
                    child.castShadow = true;
                    child.receiveShadow = true;
                    if (child.material) {
                        child.material.metalness = 0.5;
                        child.material.roughness = 0.5;
                    }
                }
            });

            // Add to scene and track AI car
            scene.add(aiCar);
            aiCars.push({
                model: aiCar,
                speed: isLeftSide ? -preferredSpeed : preferredSpeed, // Negative for forward (away), positive for backward (toward)
                preferredSpeed,
                isLeftSide,
                currentLane: laneIndex,
                targetLane: laneIndex,
                lastLaneChange: zPosition,
                isChangingLane: false,
                targetX: xPosition
            });
        },
        undefined,
        function (error) {
            console.error('Failed to load AI car:', error);
        }
    );
}

function initAICars() {
    let forwardZ = 0;
    let backwardZ = 0;
    
    for (let i = 0; i < NUM_AI_CARS; i++) {
        const baseDistance = 100;  // Base distance between cars
        const randomVariation = Math.random() * 20 - 15;  // Random variation between -10 to +10
        const isLeftSide = i < NUM_AI_CARS / 2;
        
        if (isLeftSide) {
            forwardZ -= baseDistance + randomVariation;
            createAICar(forwardZ, isLeftSide);
        } else {
            backwardZ -= baseDistance + randomVariation;
            createAICar(backwardZ, isLeftSide);
        }
    }
}

function updateAICars() {
    aiCars.forEach((aiCar, index) => {
        if (!aiCar.model || !car) return;

        const relativeZ = aiCar.model.position.z - car.position.z;
        
        if (relativeZ > 50) {
            aiCar.model.position.z = car.position.z - 100;
            const lanes = aiCar.isLeftSide ? LEFT_LANES : RIGHT_LANES;
            const newLane = Math.floor(Math.random() * lanes.length);
            aiCar.currentLane = newLane;
            aiCar.targetLane = newLane;
            aiCar.model.position.x = lanes[newLane];
        }

        // Add random movement with higher chance of choosing center lane
        if (!aiCar.isChangingLane && Math.random() < 0.02) {
            const lanes = aiCar.isLeftSide ? LEFT_LANES : RIGHT_LANES;
            const newLane = Math.random() < 0.4 ? 1 : Math.floor(Math.random() * lanes.length);
            if (newLane !== aiCar.currentLane) {
                aiCar.targetLane = newLane;
                aiCar.isChangingLane = true;
            }
        }
        
        // Add slight random speed variation
        const speedVariation = (Math.random() - 0.5) * 0.02;
        aiCar.model.position.z += aiCar.speed + speedVariation;

        // Handle lane changes with correct rotation
        if (aiCar.isChangingLane) {
            const lanes = aiCar.isLeftSide ? LEFT_LANES : RIGHT_LANES;
            const targetX = lanes[aiCar.targetLane];
            const dx = targetX - aiCar.model.position.x;
            
            aiCar.model.position.x += dx * 0.1;
            
            // Keep 90-degree base rotation during lane changes
            const baseRotation = aiCar.isLeftSide ? -Math.PI/2 : Math.PI/2;
            const turnAngle = Math.atan2(dx * 0.1, Math.abs(aiCar.speed)) * 0.2;
            aiCar.model.rotation.y = baseRotation + turnAngle;

            if (Math.abs(dx) < 0.1) {
                aiCar.currentLane = aiCar.targetLane;
                aiCar.model.position.x = targetX;
                aiCar.model.rotation.y = baseRotation;
                aiCar.isChangingLane = false;
            }
        }
    });
}

// Add center line divider with infinite recycling
function createCenterLine() {
  // Clear existing segments
  centerLineSegments.forEach(segment => {
    scene.remove(segment);
  });
  centerLineSegments = [];

  const lineMaterial = new THREE.MeshBasicMaterial({ 
    color: 0xffffff,  // White color
    side: THREE.DoubleSide 
  });

  // Create multiple segments
  const totalLength = NUM_CENTER_SEGMENTS * CENTER_SEGMENT_LENGTH;
  for (let i = 0; i < NUM_CENTER_SEGMENTS; i++) {
    const lineGeometry = new THREE.PlaneGeometry(0.2, CENTER_SEGMENT_LENGTH);
    const segment = new THREE.Mesh(lineGeometry, lineMaterial);
    segment.rotation.x = -Math.PI / 2;
    segment.position.y = 0.02;  // Slightly higher above road to prevent z-fighting
    segment.position.z = -i * CENTER_SEGMENT_LENGTH;
    scene.add(segment);
    centerLineSegments.push(segment);
  }
}

function updateCenterLine() {
  if (!car || centerLineSegments.length === 0) return;

  const baseSpeed = speed / 50;
  centerLineSegments.forEach((segment, index) => {
    // Move segment with road speed
    segment.position.z += baseSpeed;
    
    // Calculate relative position to player
    const relativeZ = segment.position.z - car.position.z;
    
    // Recycle segment when it's too far behind
    if (relativeZ > CENTER_SEGMENT_LENGTH * 2) {
      // Find the furthest segment ahead
      let minZ = Infinity;
      centerLineSegments.forEach(s => {
        if (s.position.z < minZ) {
          minZ = s.position.z;
        }
      });
      // Place this segment ahead of the furthest one
      segment.position.z = minZ - CENTER_SEGMENT_LENGTH;
    }
  });
}

function initAtmosphere() {
  // Create dynamic sky color
  scene.background = new THREE.Color(0x000000);

  // Enhanced directional light for moon/stars
  sunLight = new THREE.DirectionalLight(0xaaaaff, 1);
  sunLight.position.set(50, 100, 50);
  sunLight.castShadow = true;
  sunLight.shadow.mapSize.width = 2048;
  sunLight.shadow.mapSize.height = 2048;
  sunLight.shadow.camera.near = 0.5;
  sunLight.shadow.camera.far = 10000;
  sunLight.shadow.camera.left = -500;
  sunLight.shadow.camera.right = 500;
  sunLight.shadow.camera.top = 500;
  sunLight.shadow.camera.bottom = -500;
  scene.add(sunLight);

  // Add ambient light
  const ambientLight = new THREE.AmbientLight(0xaaaaff, 0.3);
  scene.add(ambientLight);

  // Initialize lightning flash light
  lightningFlash = new THREE.PointLight(0xffffff, 0, 1000);
  lightningFlash.position.set(0, 100, 0);
  scene.add(lightningFlash);

  // Initialize rain particles
  const rainGeometry = new THREE.BufferGeometry();
  const rainVertices = [];
  const rainVelocities = [];

  for (let i = 0; i < NUM_RAIN_DROPS; i++) {
    rainVertices.push(
      Math.random() * 400 - 200,  // x
      Math.random() * 200,        // y
      Math.random() * 400 - 200   // z
    );
    rainVelocities.push(Math.random() * 0.3 + 0.7);  // Random fall speed
  }

  rainGeometry.setAttribute('position', new THREE.Float32BufferAttribute(rainVertices, 3));
  const rainMaterial = new THREE.PointsMaterial({
    color: 0x99ccff,
    size: 0.3,
    transparent: true,
    opacity: 0.6,
    blending: THREE.AdditiveBlending
  });

  const rain = new THREE.Points(rainGeometry, rainMaterial);
  rainParticles.push(rain);
  scene.add(rain);

  // Initialize cloud particles
  const cloudGeometry = new THREE.BufferGeometry();
  const cloudVertices = [];
  for (let i = 0; i < NUM_CLOUDS; i++) {
    cloudVertices.push(
      Math.random() * 800 - 400,  // x
      Math.random() * 50 + 100,   // y
      Math.random() * 800 - 400   // z
    );
  }
  cloudGeometry.setAttribute('position', new THREE.Float32BufferAttribute(cloudVertices, 3));
  const cloudMaterial = new THREE.PointsMaterial({
    color: 0x555555,
    size: 20,
    transparent: true,
    opacity: 0.3,
    map: createCloudTexture()
  });

  const clouds = new THREE.Points(cloudGeometry, cloudMaterial);
  cloudParticles.push(clouds);
  scene.add(clouds);
}

function createCloudTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 32;
  canvas.height = 32;
  const context = canvas.getContext('2d');
  
  const gradient = context.createRadialGradient(16, 16, 0, 16, 16, 16);
  gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
  gradient.addColorStop(0.4, 'rgba(255, 255, 255, 0.8)');
  gradient.addColorStop(0.6, 'rgba(255, 255, 255, 0.2)');
  gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
  
  context.fillStyle = gradient;
  context.fillRect(0, 0, 32, 32);
  
  const texture = new THREE.Texture(canvas);
  texture.needsUpdate = true;
  return texture;
}

function updateAtmosphere() {
  time += 0.001;
  const daylight = Math.sin(time) * 0.5 + 0.5;

  // Update sky color - now only using cool colors
  if (daylight > 0.5) {  // Day
    skyColor.setHSL(0.6, 0.8, daylight);  // Blue sky
  } else {  // Night
    skyColor.setHSL(0.6, 0.3, Math.max(0.1, daylight * 0.3));  // Dark blue sky
  }
  scene.background.copy(skyColor);

  // Update sunlight with cool tones
  if (sunLight) {
    sunLight.intensity = Math.max(0.3, daylight);
    sunLight.color.setHSL(0.6, 0.2, Math.min(1, daylight + 0.2));
  }

  // Update street lights
  lights.forEach(light => {
    const pointLight = light.children[2];
    const lamp = light.children[1];
    const lightIntensity = 1 - daylight + weatherIntensity * 0.5;
    pointLight.intensity = lightIntensity;
    lamp.material.emissiveIntensity = lightIntensity;
  });

  // Update weather
  if (time - lastWeatherChange > WEATHER_CHANGE_INTERVAL) {
    lastWeatherChange = time;
    updateWeather();
  }

  // Update clouds
  if (cloudParticles.length > 0) {
    cloudParticles[0].rotation.z += 0.001;
    cloudParticles[0].material.opacity = 0.3 + weatherIntensity * 0.3;
  }

  // Update rain and add lightning during storms
  if ((weatherState === 'heavyRain' || weatherState === 'storm') && rainParticles.length > 0) {
    const positions = rainParticles[0].geometry.attributes.position.array;
    for (let i = 0; i < positions.length; i += 3) {
      positions[i + 1] -= rainVelocities[i/3] * (weatherState === 'storm' ? 1.5 : 1);
      if (positions[i + 1] < 0) {
        positions[i + 1] = 200;
        positions[i] = Math.random() * 400 - 200;
        positions[i + 2] = Math.random() * 400 - 200;
      }
    }
    rainParticles[0].geometry.attributes.position.needsUpdate = true;
    rainParticles[0].material.opacity = weatherIntensity * 0.6;

    // Add lightning during storms
    if (weatherState === 'storm' && time - lastLightningTime > Math.random() * 10) {
      createLightning();
      lastLightningTime = time;
    }
  }
}

function createLightning() {
  lightningFlash.intensity = 2;
  lightningFlash.position.set(
    Math.random() * 400 - 200,
    100,
    Math.random() * 400 - 200
  );
  
  // Fade out lightning
  setTimeout(() => {
    lightningFlash.intensity = 0;
  }, 100);
}

function updateWeather() {
  const rand = Math.random();
  if (rand < 0.4) {
    weatherState = 'clear';
    weatherIntensity = Math.random() * 0.2;
  } else if (rand < 0.8) {
    weatherState = 'heavyRain';
    weatherIntensity = 0.6 + Math.random() * 0.2;
  } else {
    weatherState = 'storm';
    weatherIntensity = 0.8 + Math.random() * 0.2;
  }
}

function findNearestCarAhead(aiCar) {
  let nearestCar = null;
  let minDistance = Infinity;

  aiCars.forEach(otherCar => {
    if (otherCar !== aiCar && 
        otherCar.isLeftSide === aiCar.isLeftSide && 
        otherCar.currentLane === aiCar.currentLane) {
      
      const distance = aiCar.isLeftSide ? 
        (otherCar.model.position.z - aiCar.model.position.z) :
        (aiCar.model.position.z - otherCar.model.position.z);

      if (distance > 0 && distance < minDistance) {
        minDistance = distance;
        nearestCar = otherCar;
      }
    }
  });

  return { car: nearestCar, distance: minDistance };
}

function checkLaneChangeOpportunity(aiCar, targetLane) {
  const safeDistance = AI_SAFE_DISTANCE;
  let isSafe = true;

  aiCars.forEach(otherCar => {
    if (otherCar !== aiCar && otherCar.isLeftSide === aiCar.isLeftSide) {
      if (otherCar.currentLane === targetLane) {
        const distance = Math.abs(otherCar.model.position.z - aiCar.model.position.z);
        if (distance < safeDistance) {
          isSafe = false;
        }
      }
    }
  });

  return isSafe;
}

function initTrees() {
  // Clear existing trees
  trees.forEach(tree => scene.remove(tree));
  trees = [];

  // Create initial set of trees with better spacing
  const treeSpacing = 30;  // Reduced spacing for denser forest
  for (let i = 0; i < NUM_TREES; i++) {
    // Add random offset for natural look
    const zOffset = (Math.random() - 0.5) * (treeSpacing * 0.5);
    const leftTree = createTree(-1, -i * treeSpacing + zOffset);
    const rightTree = createTree(1, -i * treeSpacing - zOffset);
    scene.add(leftTree);
    scene.add(rightTree);
    trees.push(leftTree);
    trees.push(rightTree);
  }
}

function updateTrees() {
  if (!car) return;

  trees.forEach((tree, index) => {
    // Calculate relative position to player
    const relativeZ = tree.position.z - car.position.z;
    
    // Recycle tree when it's too far behind
    if (relativeZ > 50) {
      // Find the furthest tree ahead
      let minZ = Infinity;
      trees.forEach(t => {
        if (t.position.z < minZ) {
          minZ = t.position.z;
        }
      });
      
      // Place tree ahead with some randomization
      const side = tree.position.x > 0 ? 1 : -1;
      const zOffset = (Math.random() - 0.5) * 15;  // Random offset for natural look
      tree.position.z = minZ - 30 + zOffset;  // Place 30 units ahead of furthest tree
      
      // Randomize tree appearance
      const scale = 0.8 + Math.random() * 0.4;  // Random scale between 0.8 and 1.2
      tree.scale.set(scale, scale, scale);
      tree.position.x = side * (16 + Math.random() * 2);  // Random x position
      tree.rotation.y = Math.random() * Math.PI * 2;  // Random rotation
    }
  });
}

function createCarPart(name, size, position, color) {
    const geometry = new THREE.BoxGeometry(size.x, size.y, size.z);
    const material = new THREE.MeshPhongMaterial({
        color: color,
        metalness: 0.7,
        roughness: 0.3
    });
    const part = new THREE.Mesh(geometry, material);
    part.position.copy(position);
    part.name = name;
    
    // Add physics properties
    part.userData.velocity = new THREE.Vector3(
        (Math.random() - 0.5) * 0.3,
        Math.random() * 0.5,
        (Math.random() - 0.5) * 0.3
    );
    part.userData.rotationSpeed = new THREE.Vector3(
        Math.random() * 0.1,
        Math.random() * 0.1,
        Math.random() * 0.1
    );
    
    return part;
}

function updateBrokenParts() {
    for (let i = brokenParts.length - 1; i >= 0; i--) {
        const part = brokenParts[i];
        
        // Apply gravity
        part.userData.velocity.y -= 0.01;
        
        // Update position
        part.position.x += part.userData.velocity.x;
        part.position.y += part.userData.velocity.y;
        part.position.z += part.userData.velocity.z;
        
        // Update rotation
        part.rotation.x += part.userData.rotationSpeed.x;
        part.rotation.y += part.userData.rotationSpeed.y;
        part.rotation.z += part.userData.rotationSpeed.z;
        
        // Remove parts that fall below ground
        if (part.position.y < -1) {
            scene.remove(part);
            brokenParts.splice(i, 1);
        }
    }
}

function breakCarParts() {
    if (!car) return;
    
    // Define car parts to break
    const parts = [
        { name: 'hood', size: { x: 1.8, y: 0.1, z: 1.2 }, offset: { x: 0, y: 0.6, z: -0.8 }, color: 0x1a1a1a },
        { name: 'trunk', size: { x: 1.8, y: 0.1, z: 1 }, offset: { x: 0, y: 0.6, z: 0.8 }, color: 0x1a1a1a },
        { name: 'door_left', size: { x: 0.1, y: 0.8, z: 1.5 }, offset: { x: -0.9, y: 0.6, z: 0 }, color: 0x1a1a1a },
        { name: 'door_right', size: { x: 0.1, y: 0.8, z: 1.5 }, offset: { x: 0.9, y: 0.6, z: 0 }, color: 0x1a1a1a },
        { name: 'windshield', size: { x: 1.6, y: 0.8, z: 0.1 }, offset: { x: 0, y: 0.8, z: -0.5 }, color: 0x88ccff },
        { name: 'rear_window', size: { x: 1.6, y: 0.8, z: 0.1 }, offset: { x: 0, y: 0.8, z: 0.5 }, color: 0x88ccff }
    ];
    
    parts.forEach(partInfo => {
        const position = new THREE.Vector3(
            car.position.x + partInfo.offset.x,
            car.position.y + partInfo.offset.y,
            car.position.z + partInfo.offset.z
        );
        
        const part = createCarPart(partInfo.name, partInfo.size, position, partInfo.color);
        scene.add(part);
        brokenParts.push(part);
  });
}

function handleCarCollision(otherCar) {
    if (!car || isInCollision) return;
    
    isInCollision = true;
    const collisionSpeed = Math.abs(speed - otherCar.speed);
    
    // Calculate damage based on collision speed
    const damage = Math.min(40, Math.floor(collisionSpeed * 1.5));
    carHealth = Math.max(0, carHealth - damage);
    updateHealthBar();

    // Break car parts if health is low
    if (carHealth < 70) {
        breakCarParts();
    }
    
    // Create collision effects
    createCollisionEffects();
    
    // Dramatic collision response
    const collisionAngle = Math.atan2(
        car.position.x - otherCar.model.position.x,
        car.position.z - otherCar.model.position.z
    );
    
    // Spin the car
    car.rotation.y += (Math.random() - 0.5) * Math.PI * 0.5;
    car.rotation.z += (Math.random() - 0.5) * 0.3;
    
    // Reduce speed based on health
    const healthFactor = carHealth / MAX_HEALTH;
    speed *= Math.max(0.1, healthFactor * 0.5);
    
    // Push cars apart
    const pushForce = 0.8;
    car.position.x += Math.cos(collisionAngle) * pushForce;
    car.position.z += Math.sin(collisionAngle) * pushForce;
    
    shakeCamera();

    // Check for game over
    if (carHealth <= 0) {
        showGameOver();
    }
    
    // Recovery
    if (collisionTimeout) clearTimeout(collisionTimeout);
    collisionTimeout = setTimeout(() => {
                isInCollision = false;
    }, COLLISION_RECOVERY_TIME);
}

function createCollisionEffects() {
    if (!car) return;
    
    // Create sparks
    const sparkCount = 20;
    const sparkGeometry = new THREE.BufferGeometry();
    const sparkVertices = [];
    
    for (let i = 0; i < sparkCount; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 0.2 + 0.1;
        sparkVertices.push(
            car.position.x,
            car.position.y,
            car.position.z
        );
    }
    
    sparkGeometry.setAttribute('position', new THREE.Float32BufferAttribute(sparkVertices, 3));
    const sparkMaterial = new THREE.PointsMaterial({
        color: 0xffaa00,
        size: 0.1,
        transparent: true,
        opacity: 1
    });
    
    const sparks = new THREE.Points(sparkGeometry, sparkMaterial);
    scene.add(sparks);
    
    // Animate sparks
    let sparkLife = 1.0;
    function animateSparks() {
        if (sparkLife > 0) {
            sparkLife -= 0.05;
            sparkMaterial.opacity = sparkLife;
            
            const positions = sparkGeometry.attributes.position.array;
            for (let i = 0; i < positions.length; i += 3) {
                positions[i] += (Math.random() - 0.5) * 0.2;
                positions[i + 1] += Math.random() * 0.1;
                positions[i + 2] += (Math.random() - 0.5) * 0.2;
            }
            sparkGeometry.attributes.position.needsUpdate = true;
            
            requestAnimationFrame(animateSparks);
        } else {
            scene.remove(sparks);
        }
    }
    animateSparks();
}

function shakeCamera() {
    const originalPos = camera.position.clone();
    let shakeTime = 0;
    const shakeDuration = 300;
    const startTime = Date.now();
    
    function shakeFrame() {
        const elapsed = Date.now() - startTime;
        if (elapsed < shakeDuration) {
            shakeTime += 0.2;
            camera.position.x = originalPos.x + Math.cos(shakeTime) * 0.1;
            camera.position.y = originalPos.y + Math.sin(shakeTime) * 0.1;
            requestAnimationFrame(shakeFrame);
        } else {
            camera.position.copy(originalPos);
        }
    }
    shakeFrame();
}
// Update the collision check in updateGame function
function checkCollisions() {
    if (!car || isInCollision) return;
    
    // Define car dimensions for more accurate collision
    const carWidth = 3;  // Increased width for more sensitive side collision
    const carLength = 4.5; // Increased length for more sensitive front/back collision
    
    // Check collisions with AI cars
    aiCars.forEach(aiCar => {
        if (!aiCar.model) return;
        
        const dx = car.position.x - aiCar.model.position.x;
        const dz = car.position.z - aiCar.model.position.z;
        const distance = Math.sqrt(dx * dx + dz * dz);
        
        if (distance < 2) {
            handleCarCollision(aiCar);
        }
    });
    
    // Check off-road collision
    if (Math.abs(car.position.x) > 12) {
        handleCarCollision({
            model: { position: new THREE.Vector3(car.position.x > 0 ? 12 : -12, car.position.y, car.position.z) },
            speed: 0
        });
        car.position.x = Math.sign(car.position.x) * 12;
    }
}

function createHealthBar() {
    // Create main health bar container
    const healthBar = document.createElement('div');
    healthBar.style.cssText = `
        position: absolute;
        bottom: 30px;
        left: 30px;
        width: 250px;
        height: 25px;
        background: rgba(0, 0, 0, 0.7);
        border: 2px solid #fff;
        border-radius: 15px;
        overflow: hidden;
        box-shadow: 0 0 10px rgba(0, 0, 0, 0.5);
    `;

    // Create health fill bar
    const healthFill = document.createElement('div');
    healthFill.id = 'healthFill';
    healthFill.style.cssText = `
        width: 100%;
        height: 100%;
        background: linear-gradient(90deg, #22ff22, #88ff88);
        transition: all 0.3s ease;
    `;
    healthBar.appendChild(healthFill);

    // Create health text
    const healthText = document.createElement('div');
    healthText.id = 'healthText';
    healthText.style.cssText = `
        position: absolute;
        top: -25px;
        left: 0;
        color: #fff;
        font-family: Arial, sans-serif;
        font-size: 16px;
        font-weight: bold;
        text-shadow: 2px 2px 2px #000;
    `;
    healthText.textContent = '100%';
    healthBar.appendChild(healthText);

    document.body.appendChild(healthBar);
}

function updateHealthBar() {
    const healthFill = document.getElementById('healthFill');
    const healthText = document.getElementById('healthText');
    const percentage = (carHealth / MAX_HEALTH) * 100;

    // Update health bar width
    healthFill.style.width = percentage + '%';

    // Update health bar color based on percentage
    if (percentage > 60) {
        healthFill.style.background = 'linear-gradient(90deg, #22ff22, #88ff88)';
    } else if (percentage > 30) {
        healthFill.style.background = 'linear-gradient(90deg, #ffff22, #ffff88)';
    } else {
        healthFill.style.background = 'linear-gradient(90deg, #ff2222, #ff8888)';
    }

    // Update health text
    healthText.textContent = Math.round(percentage) + '%';

    // Add warning effect when health is low
    if (percentage <= 30) {
        healthFill.style.animation = 'pulse 1s infinite';
        if (!document.getElementById('pulseAnimation')) {
            const style = document.createElement('style');
            style.id = 'pulseAnimation';
            style.textContent = `
                @keyframes pulse {
                    0% { opacity: 1; }
                    50% { opacity: 0.5; }
                    100% { opacity: 1; }
                }
            `;
            document.head.appendChild(style);
        }
    } else {
        healthFill.style.animation = 'none';
    }
}

function showGameOver() {
    // Check if game over screen already exists
    if (document.querySelector('div[style*="position: fixed"]')) {
        return;
    }

    const gameOverScreen = document.createElement('div');
    gameOverScreen.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: rgba(0, 0, 0, 0.9);
        padding: 30px;
        border-radius: 20px;
        text-align: center;
        color: #fff;
        font-family: Arial, sans-serif;
        z-index: 1000;
    `;

    gameOverScreen.innerHTML = `
        <h1 style="color: #ff2222; margin: 0 0 20px 0;">GAME OVER</h1>
        <p style="margin: 0 0 30px 0;">Your car was destroyed!</p>
        <button onclick="restartGame()" style="
            padding: 15px 30px;
            background: #22ff22;
            border: none;
            border-radius: 10px;
            color: #000;
            font-size: 18px;
            font-weight: bold;
            cursor: pointer;
            transition: all 0.3s ease;
        ">Play Again</button>
    `;

    document.body.appendChild(gameOverScreen);
    isGameOver = true;
}

function restartGame() {
    // Reset game variables
    carHealth = MAX_HEALTH;
    speed = 0;
    score = 0;
    isInCollision = false;
    isGameOver = false;
    lateralSpeed = 0;

    // Remove game over screen
    const gameOverScreen = document.querySelector('div[style*="position: fixed"]');
    if (gameOverScreen) {
        gameOverScreen.remove();
    }

    // Reset car position and rotation
    if (car) {
        car.position.set(0, 0.4, -2);
        car.rotation.set(0, 0, 0);
    }

    // Reset camera position and rotation
    if (camera) {
        camera.position.set(0, 2.5, 4);
        camera.lookAt(0, 0.5, 0);
    }

    // Clear broken parts
    brokenParts.forEach(part => scene.remove(part));
    brokenParts = [];

    // Reset AI cars
    aiCars.forEach(aiCar => {
        if (aiCar.model) {
            scene.remove(aiCar.model);
        }
    });
    aiCars = [];
    initAICars();

    // Reset environment
    initTrees();
    initBuildings();
    createCenterLine();

    // Reset UI
    updateHealthBar();
    document.getElementById('speedValue').textContent = '0';
    document.getElementById('scoreValue').textContent = '0';
    const speedIndicator = document.querySelector('.speed-indicator');
    if (speedIndicator) {
        speedIndicator.style.transform = 'rotate(-120deg)';
    }
}

function updateSpeedometer() {
    if (!speedValue || !speedIndicator) {
        console.warn('Speedometer elements not initialized');
        return;
    }
    
    // Update the digital speed value
    speedValue.textContent = Math.round(speed);
    
    // Calculate needle rotation
    const startAngle = -135;
    const totalAngleRange = 260;
    const speedPercentage = speed / maxSpeed;
    const needleAngle = startAngle + (totalAngleRange * speedPercentage);
    
    // Apply rotation to the needle
    speedIndicator.style.transform = `rotate(${needleAngle}deg)`;
}

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

window.onload = init;

