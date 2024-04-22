let savedPopulation ;
let population;
let populationSize = 1500;
let lifespan = 1000;
let generation = 1;
let generationInfo = [];
let count = 0;
let target;
let maxfore = 0.3;

let obstacles = [];
let maxFit = 0;
let canvas;

let firstCompletion = false;
let firstCompletionIndex = -1;

let maxGottenLifespan = 0;
let fastestTime = lifespan;

function setup() {
    canvas = createCanvas(900, 1200);
    canvas.parent("canvas");


    if(savedPopulation){
        console.log("Setup saved population");
        population = savedPopulation;
    }else {
        console.log("Setup new population");
        population = new Population();
        console.log("popul:", population)
    }

    target = createVector(width/2, 100);

    obstacles.push(new Obstacle(0, 300, 600, 20));
    obstacles.push(new Obstacle(300, 900, 600, 20));

    obstacles.push(new Obstacle(0, 700, 600, 20));
    obstacles.push(new Obstacle(300, 500, 600, 20));
}

function draw() {
    background(0);
    population.run();


    fill(255);
    textSize(20);
    textAlign(RIGHT);
    text("Lifespan: " + count, width - 10, 20);
    textSize(16);
    text("Max fitenss: " + maxFit.toFixed(3), width - 10, 40);
    text("Max lifespan: " + maxGottenLifespan, width - 10, 60);
    text("Fastest Time: " + fastestTime, width - 10, 80);
    count++;

    if (!firstCompletion && checkForCompletion()) {
        firstCompletion = true;
        firstCompletionIndex = generationInfo.length - 1;
    }

    if(count === lifespan){
        nextGeneration();
    }

    for (let i = 0; i < obstacles.length; i++) {
        obstacles[i].show();
    }

    ellipse(target.x, target.y, 20, 20);
}

function displayInfo() {
    let generationInfoDiv = document.getElementById("generationInfo");
    generationInfoDiv.innerHTML = "";
    generationInfo.forEach((entry,index) => {
        let p = document.createElement("p");
        p.textContent = `Generation: ${entry.generation}, Max Fitness: ${entry.maxFitness}, Max Lifespan: ${entry.lifespan}`;
        p.classList.add("generationEntry");
        if(index === firstCompletionIndex){
            p.classList.add("firstCompletion");
        }
        generationInfoDiv.appendChild(p);
    });
}

function checkForCompletion() {
    for (let i = 0; i < population.cars.length; i++) {
        if (population.cars[i].completed) {
            return true;
        }
    }
    return false;
}

function Obstacle(x, y, w, h) {
    this.x = x;
    this.y = y;
    this.w = w;
    this.h = h;

    this.show = function () {
        fill(250);
        rect(this.x, this.y, this.w, this.h);
    }

    this.checkCollision = function (carX, carY) {
        return (carX > this.x && carX < this.x + this.w && carY > this.y && carY < this.y + this.h);
    }

    this.rayIntersection = function(rayStart, rayEnd) {
        let minX = this.x;
        let maxX = this.x + this.w;
        let minY = this.y;
        let maxY = this.y + this.h;

        // Extend the AABB to include the screen edges
        let screenMinX = 0;
        let screenMaxX = width;
        let screenMinY = 0;
        let screenMaxY = height;

        // Calculate intersection parameters as before
        let directionX = rayEnd.x - rayStart.x;
        let directionY = rayEnd.y - rayStart.y;
        let originX = rayStart.x;
        let originY = rayStart.y;

        let tmin = (minX - originX) / directionX;
        let tmax = (maxX - originX) / directionX;
        let tymin = (minY - originY) / directionY;
        let tymax = (maxY - originY) / directionY;

        // Check for intersection with the screen boundaries
        let screenTMinX = (screenMinX - originX) / directionX;
        let screenTMaxX = (screenMaxX - originX) / directionX;
        let screenTMinY = (screenMinY - originY) / directionY;
        let screenTMaxY = (screenMaxY - originY) / directionY;

        tmin = max(tmin, min(screenTMinX, screenTMaxX));
        tmax = min(tmax, max(screenTMinX, screenTMaxX));
        tymin = max(tymin, min(screenTMinY, screenTMaxY));
        tymax = min(tymax, max(screenTMinY, screenTMaxY));


        if (tmin > tmax) {
            let temp = tmin;
            tmin = tmax;
            tmax = temp;
        }

        if (tymin > tymax) {
            let temp = tymin;
            tymin = tymax;
            tymax = temp;
        }

        if (tmin > tymax || tymin > tmax) {
            return null;
        }

        if (tymin > tmin) {
            tmin = tymin;
        }

        if (tymax < tmax) {
            tmax = tymax;
        }

        let intersectionX = originX + tmin * directionX;
        let intersectionY = originY + tmin * directionY;

        return createVector(intersectionX, intersectionY);
    };



}

function Car(dna) {
    this.pos = createVector(width/2, height-60);
    this.vel = createVector();
    this.acc = createVector();
    this.angle = 0;
    this.maxSpeed = 5;
    this.maxForce = 0.1;
    this.fitness = 0;
    this.completed = false;
    this.crashed = false;
    this.time = lifespan;

    if(dna){
        this.dna = dna;
    }else {
        this.dna = new DNA();
    }

    this.applyForce = function (force){
        this.acc.add(force);
    }

    this.calcFitness = function () {
        let d = dist(this.pos.x, this.pos.y, target.x, target.y);
        this.fitness = map(d, 0, width, width, 0);
        let timeFactor = map(count, 0, lifespan, 10, 1);
        if(this.completed) {
            this.fitness *= timeFactor * 10;
            if(fastestTime < count){
                fastestTime = count;
            }
        }else if(this.crashed) {
            this.fitness /= timeFactor;
        }else if(!this.crashed && !this.completed) {
            this.fitness /= timeFactor/2;
        }
    }

    this.update = function () {
        //console.log("Updating car position");
        if (this.completed || this.crashed) {
            return;
        }

        // Boundary detection
        if (this.pos.x > width || this.pos.x < 0 || this.pos.y > height || this.pos.y < 0) {
            this.crashed = true;
        } else if (dist(this.pos.x, this.pos.y, target.x, target.y) < 10) {
            this.completed = true;
            this.pos = target.copy();
        } else {
            for (let i = 0; i < obstacles.length; i++) {
                if (obstacles[i].checkCollision(this.pos.x, this.pos.y)) {
                    this.crashed = true;
                    break;
                }
            }
        }
            // Obstacle avoidance using raycasting
            let avoidanceForce = this.avoidObstacles();
            this.applyForce(avoidanceForce);
            //console.log("Avoidance force:", avoidanceForce);

            // Apply steering behaviors (acceleration and turning)
            let desired = createVector(); // Calculate desired velocity
            //let steer = createVector(); // Calculate steering force


            // Adjust steering based on DNA
            let steerForce = this.dna.genes[count];
            //console.log("Steer force:", steerForce); // Check steerForce

            // Extract angle from steerForce vector
            let angle = atan2(steerForce.y, steerForce.x);

            // Create a vector manually
            let steer = p5.Vector.fromAngle(angle);
            //console.log("Steer:", steer)

            steer.mult(2); // Adjust for steering force
            //console.log("Steer after adjusting magnitude:", steer); // Check steer after adjusting magnitude

            // Apply the steer vector as a force
            this.applyForce(steer); // Check if steer is correctly applied as a force

            // Check forces
            //console.log("Steer after applying force:", steer); // Check steer after applying force




        // Update angle based on velocity direction
            this.angle = this.vel.heading();
            //console.log("angle update:", this.angle);


            // Update velocity, position, and angle
            //console.log("Before velocity update:", this.vel);
            this.vel.add(this.acc);
            //console.log("After velocity update:", this.vel);

            //console.log("Before position update:", this.pos);
            this.pos.add(this.vel);
            //console.log("After position update:", this.pos);

            this.acc.mult(0);

            this.vel.limit(this.maxSpeed);

/*
        this.applyForce(this.dna.genes[count]);
        if(!this.completed && !this.crashed){
            this.vel.add(this.acc);
            this.pos.add(this.vel);
            this.acc.mult(0);
            this.vel.limit(5);
        }
 */

    }

    this.avoidObstacles = function () {
        let avoidance = createVector();
        let rays = 36; // Number of rays for raycasting
        let angleIncrement = TWO_PI / rays;

        for (let i = 0; i < rays; i++) {
            let rayAngle = this.vel.heading() - HALF_PI + i * angleIncrement; // Start from the left side of the car
            let rayDirection = createVector(cos(rayAngle), sin(rayAngle));
            let maxRayLength = 100; // Maximum length of the ray

            // Cast ray and check for intersections with obstacles
            let rayEnd = p5.Vector.add(this.pos, p5.Vector.mult(rayDirection, maxRayLength));
            let closestIntersect = null;
            let closestDist = maxRayLength;

            for (let j = 0; j < obstacles.length; j++) {
                let intersect = obstacles[j].rayIntersection(this.pos, rayEnd);
                if (intersect) {
                    let d = p5.Vector.dist(this.pos, intersect);
                    if (d < closestDist) {
                        closestDist = d;
                        closestIntersect = intersect;
                    }
                }
            }

            // If an intersection is found, steer away from the obstacle
            if (closestIntersect) {
                let steerForce = p5.Vector.sub(closestIntersect, this.pos);
                steerForce.setMag(map(closestDist, 0, maxRayLength, this.maxForce, 0)); // Inverse proportion to distance
                avoidance.add(steerForce);
            }
        }
        //console.log(avoidance);
        return avoidance;
    }

    this.show = function () {
        push();
        noStroke();
        fill(255, 100);
        translate(this.pos.x, this.pos.y);
        rotate(this.vel.heading());
        rectMode(CENTER);
        rect(0, 0, 30, 15);
        pop();
    }
}

function Population() {
    this.cars = [];
    this.popsize = populationSize;
    this.matingpool = [];



    console.log('Creating a new population...');
    for (let i = 0; i < this.popsize; i++) {
        this.cars[i] = new Car();
    }
    //console.log(this.cars);


    this.evaluate = function() {
        let maxfit = 0;
        for (let i = 0; i < this.popsize; i++) {
            this.cars[i].calcFitness();
            if(this.cars[i].fitness > maxfit){
                maxfit = this.cars[i].fitness;
            }
        }
        maxFit = maxfit;

        //createP(maxfit);
        //console.log(this.cars);

        for (let i = 0; i < this.popsize; i++) {
            this.cars[i].fitness /= maxfit;
        }

        this.matingpool = [];
        for (let i = 0; i < this.popsize; i++) {
            //let n = floor(this.cars[i].fitness * 100);
            let n = this.cars[i].fitness * 100;
            for (let j = 0; j < n; j++) {
                this.matingpool.push(this.cars[i]);
            }
        }
    }

    this.selection = function () {
        let newCars = [];
        for (let i = 0; i < this.cars.length; i++) {
            let parentA = random(this.matingpool).dna;
            let parentB = random(this.matingpool).dna;
            let child = parentA.crossover(parentB);
            child.mutation();
            newCars[i] = new Car(child);
        }
        this.cars = newCars;
    }

    this.run = function (){
        //console.log("Running population");
        let allCrashed = true;
        let allCompleted = true;

        for (let i = 0; i < this.popsize; i++) {
            this.cars[i].update();
            this.cars[i].show();

            if (!this.cars[i].completed) {
                allCompleted = false;
            }
            if (!this.cars[i].crashed) {
                allCrashed = false;
            }
        }

        if (allCompleted || allCrashed) {
            nextGeneration();
        }
    }
}

function DNA(genes) {
    if(genes){
        this.genes = genes;
    }else {
        this.genes = [];
        for (let i = 0; i < lifespan; i++) {
            this.genes[i] = p5.Vector.random2D();
            this.genes[i].setMag(maxfore);
        }
    }

    this.crossover = function (partner) {
        let newgenes = [];
        let mid = floor(random(this.genes.length));
        for (let i = 0; i < this.genes.length; i++) {
            if(i > mid){
                newgenes[i] = this.genes[i];
            }else{
                newgenes[i] = partner.genes[i];
            }
        }
        return new DNA(newgenes);
    }

    this.mutation = function () {
        for (let i = 0; i < this.genes.length; i++) {
            if(random(1) < 0.01) {
                this.genes[i] = p5.Vector.random2D();
                this.genes[i].setMag(maxfore);
            }
        }
    }
}

function nextGeneration() {
    population.evaluate();
    population.selection();

    generationInfo.push({ generation: generation, maxFitness: maxFit, lifespan: count});

    if(maxGottenLifespan < count){
        maxGottenLifespan = count;
    }

    displayInfo();

    count = 0;
    generation++;
}

// Saving results
function saveResults() {
    // Define the URL of the server endpoint
    const url = 'http://localhost:3000/save';

    // Create the request options
    const options = {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(population)
    };

    // Send the POST request to the server
    fetch(url, options)
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to save population data');
            }
            console.log('Population data saved successfully');
            console.log("Saved-Population", population);
        })
        .catch(error => {
            console.error('Error saving population data:', error);
        });
}

// Loading results
function loadResults() {
    return fetch('http://localhost:3000/load')
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to load population data');
            }
            return response.json();
        })
        .then(data => {
            // Check if the received data is in the expected format
            if (data && data.cars && Array.isArray(data.cars) && data.popsize && data.matingpool && Array.isArray(data.matingpool)) {
                // Create a new Population object and update it with the loaded data
                const loadedPopulation = new Population();
                loadedPopulation.cars = data.cars;
                loadedPopulation.popsize = data.popsize;
                loadedPopulation.matingpool = data.matingpool;

                console.log('Population data loaded successfully:', loadedPopulation);
                return loadedPopulation;
            } else {
                throw new Error('Invalid population data format');
            }
        })
        .catch(error => {
            console.error('Error loading population data:', error);
            return null;
        });
}


