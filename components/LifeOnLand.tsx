import React, { useEffect, useRef } from 'react';

// Define a class for land animals
interface Animal {
  position: any; // p5.Vector
  velocity: any; // p5.Vector
  acceleration: any; // p5.Vector
  maxSpeed: number;
  size: number;
  color: any; // p5.Color
  type: 'deer' | 'rabbit' | 'squirrel';
}

const LifeOnLand: React.FC = () => {
  const canvasRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!canvasRef.current || typeof window === 'undefined') return;

    // Dynamically import p5 only on client side
    const p5Module = require('p5');
    const p5 = p5Module;
    
    const sketch = (p: any) => {
      // Simulation parameters
      const N = 10;                 // Number of terrain types
      const threshold = 5;          // Basic terrain transition threshold
      const thresholdFast = 7;      // Fast transition threshold
      const thresholdDead = 1;      // Low transition threshold
      let cellSize = 15;            // Pixel size - will be dynamic
      const voronoi_count = 25;     // Number of terrain regions
      const voronoi_offset = true;  // Use offset by region
      const scanRange = 2;          // Neighborhood scan range

      let cols: number, rows: number;
      let grid: number[][], nextGrid: number[][];
      let sites: any[] = []; // p5.Vector[]
      let colors: any[] = []; // p5.Color[]
      let cellOwners: number[][] = [];
      let terrainStates: any[]; // p5.Color[]
      let d = 0.3;

      // Land animals simulation - deer, rabbits, and squirrels
      const animalCount = 80;  // Increased total count
      let animals: Animal[] = [];

      // Forest elements for woodland atmosphere
      let forestElements: any[] = []; // Trees, rocks, bushes

      const ANIMAL_CONFIG = {
        deer: { prob: 0.25, speed: [0.8, 1.8], size: [12, 16], color: [139, 69, 19], sep: 35, neighbor: 60, forces: [1.8, 1.2, 1.5, 0.4] },
        rabbit: { prob: 0.45, speed: [1.0, 2.2], size: [8, 11], color: [160, 82, 45], sep: 20, neighbor: 40, forces: [2.2, 0.8, 1.8, 0.7] },
        squirrel: { prob: 1, speed: [1.2, 2.5], size: [6, 9], color: [101, 67, 33], sep: 15, neighbor: 30, forces: [2.5, 1.0, 2.0, 0.9] }
      };

      // Calculate appropriate cell size
      function calculateCellSize() {
        // Dynamic cell size based on screen size
        return Math.max(8, Math.floor(Math.min(p.width, p.height) / 80));
      }

      p.setup = () => {
        // Create canvas at full window size
        p.createCanvas(p.windowWidth, p.windowHeight);
        
        // Set background first
        p.background(45, 80, 22);
        
        // Adjust cell size based on screen size
        cellSize = calculateCellSize();
        
        // Calculate grid dimensions
        cols = p.floor(p.width / cellSize);
        rows = p.floor(p.height / cellSize);
        
        // Colors representing different terrain types (grasslands, plains, plateaus)
        terrainStates = [
          p.color(34, 139, 34, 180),   // Forest green: Dense grassland
          p.color(107, 142, 35, 160),  // Olive drab: Mountain grassland
          p.color(154, 205, 50, 140),  // Yellow green: Plains
          p.color(124, 252, 0, 150),   // Lawn green: Fresh meadows
          p.color(50, 205, 50, 170),   // Lime green: Fertile plains
          p.color(85, 107, 47, 190),   // Dark olive: Plateau vegetation
          p.color(143, 188, 143, 160), // Dark sea green: Hill grassland
          p.color(60, 179, 113, 150),  // Medium sea green: Valley grass
          p.color(46, 125, 50, 180),   // Dark green: Dense forest edge
          p.color(139, 195, 74, 140),  // Light green: Open grassland
        ];

        // Create cell owner array
        cellOwners = new Array(cols);
        for (let x = 0; x < cols; x++) {
          cellOwners[x] = new Array(rows).fill(0);
        }

        init_voronoi();
        initializeGrid();
        initializeAnimals();
        initializeForestElements();
      };

      function initializeAnimals() {
        animals = [];
        
        // Create deer, rabbits, and squirrels with squirrels being most numerous
        for (let i = 0; i < animalCount; i++) {
          const rand = p.random(1);
          let config = rand < 0.25 ? ANIMAL_CONFIG.deer : rand < 0.45 ? ANIMAL_CONFIG.rabbit : ANIMAL_CONFIG.squirrel;
          let type = rand < 0.25 ? 'deer' : rand < 0.45 ? 'rabbit' : 'squirrel';
          
          const animal: Animal = {
            position: p.createVector(p.random(p.width), p.random(p.height)),
            velocity: p.createVector(p.random(-2, 2), p.random(-2, 2)),
            acceleration: p.createVector(0, 0),
            maxSpeed: p.random(config.speed[0], config.speed[1]),
            size: p.random(config.size[0], config.size[1]),
            color: p.color(config.color[0], config.color[1], config.color[2], 255),
            type: type as 'deer' | 'rabbit' | 'squirrel'
          };
          animals.push(animal);
        }
      }

      function initializeForestElements() {
        forestElements = [];
        const treeCount = Math.floor((p.width * p.height) / 6000);
        
        for (let i = 0; i < treeCount; i++) {
          const isOak = p.random() < 0.5;
          let element: any;
          
          if (isOak) {
            element = {
              type: 'oak',
              x: p.random(p.width),
              y: p.random(p.height),
              trunkWidth: p.random(8, 15),
              trunkHeight: p.random(40, 60),
              crownSize: p.random(40, 70),
              layers: 3,
              trunkColor: p.color(p.random(70, 90), p.random(45, 65), p.random(25, 35)),
              crownColor: p.color(p.random(25, 45), p.random(70, 120), p.random(15, 35))
            };
          } else {
            element = {
              type: 'pine',
              x: p.random(p.width),
              y: p.random(p.height),
              trunkWidth: p.random(6, 12),
              trunkHeight: p.random(30, 50),
              crownSize: p.random(25, 45),
              layers: p.random(4, 7),
              trunkColor: p.color(p.random(80, 100), p.random(50, 70), p.random(30, 40)),
              crownColor: p.color(p.random(15, 35), p.random(60, 100), p.random(20, 40))
            };
          }
          
          forestElements.push(element);
        }
      }

      function updateAnimals() {
        for (let i = 0; i < animals.length; i++) {
          const animal = animals[i];
          const config = ANIMAL_CONFIG[animal.type];
          
          const forces = calculateFlocking(animal, i);
          const wanderForce = p.createVector(
            p.noise(animal.position.x * 0.008, animal.position.y * 0.008, p.frameCount * 0.008) - 0.5, 
            p.noise(animal.position.y * 0.008, p.frameCount * 0.008) - 0.5
          );
          
          forces.separation.mult(config.forces[0]);
          forces.alignment.mult(config.forces[1]);
          forces.cohesion.mult(config.forces[2]);
          wanderForce.mult(config.forces[3]);
          
          animal.acceleration.add(forces.separation);
          animal.acceleration.add(forces.alignment);
          animal.acceleration.add(forces.cohesion);
          animal.acceleration.add(wanderForce);
          
          animal.velocity.add(animal.acceleration);
          animal.velocity.limit(animal.maxSpeed);
          animal.position.add(animal.velocity);
          animal.acceleration.mult(0);
          
          if (animal.position.x < 0) animal.position.x = p.width;
          if (animal.position.y < 0) animal.position.y = p.height;
          if (animal.position.x > p.width) animal.position.x = 0;
          if (animal.position.y > p.height) animal.position.y = 0;
        }
      }
      
      function calculateFlocking(animal: Animal, index: number) {
        const config = ANIMAL_CONFIG[animal.type];
        const separation = p.createVector(0, 0);
        const alignment = p.createVector(0, 0);
        let cohesion = p.createVector(0, 0);
        let sepCount = 0, alignCount = 0, cohCount = 0;
        
        for (let i = 0; i < animals.length; i++) {
          if (i === index) continue;
          
          const other = animals[i];
          const d = p.dist(animal.position.x, animal.position.y, other.position.x, other.position.y);
          
          if (d < config.sep) {
            const diff = p.createVector(animal.position.x - other.position.x, animal.position.y - other.position.y);
            diff.normalize();
            diff.div(d);
            separation.add(diff);
            sepCount++;
          }
          
          if (d < config.neighbor && other.type === animal.type) {
            alignment.add(other.velocity);
            cohesion.add(other.position);
            alignCount++;
            cohCount++;
          }
        }
        
        if (sepCount > 0) {
          separation.div(sepCount);
          separation.normalize();
          separation.mult(animal.maxSpeed);
          separation.sub(animal.velocity);
          separation.limit(0.5);
        }
        
        if (alignCount > 0) {
          alignment.div(alignCount);
          alignment.normalize();
          alignment.mult(animal.maxSpeed);
          alignment.sub(animal.velocity);
          alignment.limit(0.3);
        }
        
        if (cohCount > 0) {
          cohesion.div(cohCount);
          const desired = p.createVector(cohesion.x - animal.position.x, cohesion.y - animal.position.y);
          desired.normalize();
          desired.mult(animal.maxSpeed);
          cohesion = p.createVector(desired.x - animal.velocity.x, desired.y - animal.velocity.y);
          cohesion.limit(0.3);
        }
        
        return { separation, alignment, cohesion };
      }

      function drawAnimals() {
        for (let i = 0; i < animals.length; i++) {
          const animal = animals[i];
          
          p.push();
          p.translate(animal.position.x, animal.position.y);
          
          // Calculate rotation based on velocity for movement direction
          const angle = p.atan2(animal.velocity.y, animal.velocity.x);
          p.rotate(angle);
          
          // Set animal color
          p.fill(animal.color);
          p.noStroke();
          
          if (animal.type === 'deer') {
            // Bird's eye view of deer - oval body with antler indication
            p.ellipse(0, 0, animal.size * 2.2, animal.size * 1.4);
            
            // Small head bump at front
            p.ellipse(animal.size * 1.1, 0, animal.size * 0.8, animal.size * 0.7);
            
            // More prominent antler indication - larger and more visible
            p.fill(101, 67, 33); // Darker brown for antlers
            // Main antler branches
            p.ellipse(animal.size * 1.4, -animal.size * 0.5, animal.size * 0.5, animal.size * 0.3);
            p.ellipse(animal.size * 1.4, animal.size * 0.5, animal.size * 0.5, animal.size * 0.3);
            // Antler points
            p.ellipse(animal.size * 1.6, -animal.size * 0.7, animal.size * 0.25, animal.size * 0.15);
            p.ellipse(animal.size * 1.6, animal.size * 0.7, animal.size * 0.25, animal.size * 0.15);
            p.ellipse(animal.size * 1.3, -animal.size * 0.8, animal.size * 0.2, animal.size * 0.12);
            p.ellipse(animal.size * 1.3, animal.size * 0.8, animal.size * 0.2, animal.size * 0.12);
            
          } else if (animal.type === 'rabbit') {
            // Bird's eye view of rabbit - smaller oval body
            p.ellipse(0, 0, animal.size * 1.8, animal.size * 1.2);
            
            // Small head at front
            p.ellipse(animal.size * 0.9, 0, animal.size * 0.7, animal.size * 0.6);
            
            // Long ears extending from head
            p.fill(160, 82, 45, 200); // Slightly transparent ears
            p.ellipse(animal.size * 1.2, -animal.size * 0.5, animal.size * 0.25, animal.size * 0.8);
            p.ellipse(animal.size * 1.2, animal.size * 0.5, animal.size * 0.25, animal.size * 0.8);
            
            // Small cotton tail at back
            p.fill(255, 255, 255);
            p.ellipse(-animal.size * 0.9, 0, animal.size * 0.4, animal.size * 0.4);
            
          } else { // squirrel
            // Bird's eye view of squirrel - small oval body
            p.ellipse(0, 0, animal.size * 1.5, animal.size * 1.0);
            
            // Small pointed head
            p.ellipse(animal.size * 0.75, 0, animal.size * 0.6, animal.size * 0.5);
            
            // Bushy tail - large oval at back
            p.fill(85, 60, 25, 180); // Slightly darker and transparent
            p.ellipse(-animal.size * 0.8, 0, animal.size * 1.0, animal.size * 1.8);
            
            // Small ears
            p.fill(animal.color);
            p.ellipse(animal.size * 0.9, -animal.size * 0.3, animal.size * 0.2, animal.size * 0.3);
            p.ellipse(animal.size * 0.9, animal.size * 0.3, animal.size * 0.2, animal.size * 0.3);
          }
          
          // Draw simple eye indication for all animals (small dot)
          p.fill(0);
          p.ellipse(animal.size * 0.5, 0, animal.size * 0.1, animal.size * 0.1);
          
          p.pop();
        }
      }

      function drawForestElements() {
        for (let element of forestElements) {
          p.push();
          p.noStroke();
          
          if (element.type === 'oak') {
            // Draw oak trunk - thick and sturdy
            p.fill(element.trunkColor);
            p.rect(element.x - element.trunkWidth/2, element.y - element.trunkHeight/2, element.trunkWidth, element.trunkHeight);
            
            // Draw oak crown with multiple layers for fullness - positioned above trunk
            p.fill(element.crownColor);
            for (let layer = 0; layer < element.layers; layer++) {
              const layerOffset = layer * 8;
              const layerSize = element.crownSize - layerOffset;
              p.ellipse(
                element.x, 
                element.y - element.trunkHeight * 0.6 - layerOffset, 
                layerSize, 
                layerSize * 0.9
              );
            }
            
            // Add some texture with darker spots
            p.fill(element.crownColor.levels[0] - 20, element.crownColor.levels[1] - 15, element.crownColor.levels[2] - 10);
            for (let spot = 0; spot < 4; spot++) {
              p.ellipse(
                element.x + (spot % 2 === 0 ? -element.crownSize * 0.2 : element.crownSize * 0.2),
                element.y - element.trunkHeight * 0.6 + (spot < 2 ? -element.crownSize * 0.2 : element.crownSize * 0.2),
                12,
                12
              );
            }
            
          } else if (element.type === 'pine') {
            // Draw pine trunk - tall and straight
            p.fill(element.trunkColor);
            p.rect(element.x - element.trunkWidth/2, element.y - element.trunkHeight/2, element.trunkWidth, element.trunkHeight);
            
            // Draw pine layers from bottom to top
            p.fill(element.crownColor);
            for (let layer = 0; layer < element.layers; layer++) {
              const layerY = element.y - element.trunkHeight * 0.3 - (layer * element.trunkHeight * 0.15);
              const layerSize = element.crownSize - (layer * 5);
              
              // Triangle-like shape for pine layers
              p.ellipse(element.x, layerY, layerSize, layerSize * 0.6);
            }
            
            // Add pine texture with small needle clusters
            p.fill(element.crownColor.levels[0] - 15, element.crownColor.levels[1] - 10, element.crownColor.levels[2] - 5);
            for (let needle = 0; needle < 6; needle++) {
              const needleLayer = p.floor(p.random(element.layers));
              const layerY = element.y - element.trunkHeight * 0.3 - (needleLayer * element.trunkHeight * 0.15);
              p.ellipse(
                element.x + p.random(-element.crownSize * 0.4, element.crownSize * 0.4),
                layerY + p.random(-10, 10),
                p.random(3, 6),
                p.random(3, 6)
              );
            }
          }
          
          p.pop();
        }
      }

      p.draw = () => {
        if (p.frameCount % 10 === 0) updateGrid((d + 0.2) / 1.2);
        update_voronoi();
        displayGrid();
        drawForestElements();
        updateAnimals();
        drawAnimals();
        d = p.constrain(d + deltaHop(p.millis() / 5000), 0, 1);
      };

      function pinch(v: number, x: number): number {
        const a = p.max(v, x) - x;
        const b = x - p.min(v, x);
        return 2 * a * a - 2 * b * b + x;
      }

      function noiseHopper(x: number): number {
        return pinch((pinch(p.noise(x), 1) + pinch(p.noise(0, x), 0)) / 2, 0.5);
      }

      function deltaHop(t: number): number {
        return (noiseHopper(t) - 0.5);
      }

      // Initialize terrain regions
      function init_voronoi() {
        sites = [];
        colors = [];
        for (let i = 0; i < voronoi_count; i++) {
          sites.push(p.createVector(p.random(p.width), p.random(p.height)));
          colors.push(p.color(
            p.random(50, 150),
            p.random(80, 200), 
            p.random(20, 80)
          ));
        }
      }

      // Evolution of terrain regions (much slower movement)
      function update_voronoi() {
        for (let i = 0; i < voronoi_count; i++) {
          sites[i].x = p.lerp(sites[i].x, p.width / 2, 0.0001); // Reduced movement speed
          sites[i].x = p.constrain(sites[i].x + 0.1 * (p.noise(i * 1000 + p.millis() / 2000.0) - 0.5), 0, p.width); // Reduced movement speed
          sites[i].y = p.lerp(sites[i].y, p.height / 2, 0.0001); // Reduced movement speed
          sites[i].y = p.constrain(sites[i].y + 0.2 * (p.noise(i * 2000 + p.millis() / 2000.0) - 0.5), 0, p.height); // Reduced movement speed
        }

        // Assign each cell to nearest terrain region
        for (let x = 0; x < cols; x++) {
          for (let y = 0; y < rows; y++) {
            let closest = -1;
            let minDist = Infinity;
            for (let i = 0; i < sites.length; i++) {
              const dx = sites[i].x - (x * cellSize);
              const dy = sites[i].y - (y * cellSize);
              const d = (dx * dx + dy * dy);
              if (d < minDist) {
                minDist = d;
                closest = i;
              }
            }
            cellOwners[x][y] = closest;
          }
        }
      }

      // Assign random initial terrain states
      function initializeGrid() {
        grid = new Array(cols).fill(0).map(() => new Array(rows).fill(0).map(() => p.floor(p.random(N))));
        nextGrid = new Array(cols).fill(0).map(() => new Array(rows).fill(0));
      }

      // Simulate terrain transitions (cellular automaton)
      function updateGrid(border: number) {
        for (let x = 0; x < cols; x++) {
          for (let y = 0; y < rows; y++) {
            const currentState = grid[x][y];

            // Simulate terrain transitions at region boundaries
            if (p.random(1) < border) {
              for (let m = 0; m < 2; m++) {
                for (let q = 0; q < 2; q++) {
                  if (x - m < 0 || y - q < 0) continue;
                  if (cellOwners[x][y] !== cellOwners[x - m][y - q]) {
                    nextGrid[x - m][y - q] = p.int((p.random(N) + 1) % N);
                  }
                }
              }
            }

            // Terrain interaction between neighboring cells
            let count = 0;
            for (let dx = -scanRange; dx <= scanRange; dx++) {
              for (let dy = -scanRange; dy <= scanRange; dy++) {
                const nx = (x + dx + cols) % cols;
                const ny = (y + dy + rows) % rows;
                if (grid[nx][ny] === (currentState + 1) % N) {
                  count++;
                }
              }
            }

            // Terrain transformation rules
            do {
              nextGrid[x][y] = currentState;
              
              if (count >= threshold) {
                nextGrid[x][y] = (currentState + 1) % N;
                break;
              }
              
              if (count >= thresholdFast) {
                nextGrid[x][y] = (currentState + 2) % N;
                break;
              }
              
              if (count <= thresholdDead) {
                nextGrid[x][y] = (currentState + N - 1) % N;
                break;
              }
            } while (false);
          }
        }
        const tmp = grid;
        grid = nextGrid;
        nextGrid = tmp;
      }

      // Visualization - Much calmer terrain movement
      function displayGrid() {
        p.background(45, 80, 22, 40); // Dark green land background with more opacity for calmer feel
        p.noStroke();
        
        const skipFactor = 1; // Draw every cell for solid terrain
        
        for (let x = 0; x < cols; x += skipFactor) {
          for (let y = 0; y < rows; y += skipFactor) {
            const stateIndex = (grid[x][y] + (voronoi_offset ? cellOwners[x][y] % 3 : 0)) % N;
            p.fill(terrainStates[stateIndex]);
            
            // Much reduced vibration effect - very subtle movement
            const vibrateX = p.noise(x * 0.05, y * 0.05, p.frameCount * 0.005) * 0.5 - 0.25; // Much smaller range
            const vibrateY = p.noise(x * 0.05 + 100, y * 0.05 + 100, p.frameCount * 0.005) * 0.5 - 0.25; // Much smaller range
            
            const finalSize = cellSize * skipFactor;
            
            p.rect(
              x * cellSize + vibrateX, 
              y * cellSize + vibrateY, 
              finalSize, 
              finalSize
            );
          }
        }
      }

      p.windowResized = () => {
        p.resizeCanvas(p.windowWidth, p.windowHeight);
        cellSize = calculateCellSize();
        cols = p.floor(p.width / cellSize);
        rows = p.floor(p.height / cellSize);
        
        // Reinitialize arrays with new dimensions
        cellOwners = new Array(cols);
        for (let x = 0; x < cols; x++) {
          cellOwners[x] = new Array(rows).fill(0);
        }
        
        initializeGrid();
        init_voronoi();
        initializeForestElements();
      };
    };

    // Store p5 instance for cleanup
    const p5Instance = new p5(sketch, canvasRef.current || undefined);
    return () => {
      p5Instance.remove();
    };
  }, []);

  return (
    <div style={{ 
      position: 'fixed', 
      top: 0, 
      left: 0, 
      bottom: 0, 
      right: 0, 
      overflow: 'hidden',
      width: '100vw', 
      height: '100vh',
      margin: 0,
      padding: 0,
      background: '#2d5016' // Dark green land background
    }}>
      <div ref={canvasRef} style={{ 
        width: '100%', 
        height: '100%' 
      }} />
    </div>
  );
};

export default LifeOnLand; 