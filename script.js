let population;
let lifespan = 900;
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

let maxGottenFitness = 0;
let maxGottenLifespan = 0;

function setup() {
    canvas = createCanvas(900, 1100);
    canvas.parent("canvas");

    population = new Population();

    target = createVector(width/2, 100);

    obstacles.push(new Obstacle(250, 300, 400, 20));
    obstacles.push(new Obstacle(300, 750, 300, 20));

    obstacles.push(new Obstacle(0, 450, 250, 20));
    obstacles.push(new Obstacle(650, 450, 250, 20));
}

function draw() {
    background(0);
    population.run();


    fill(255);
    textSize(20);
    textAlign(RIGHT);
    text("Lifespan: " + count, width - 10, 20);
    textSize(16);
    text("Max fitenss: " + maxGottenFitness.toFixed(3), width - 10, 40);
    text("Max lifespan: " + maxGottenLifespan, width - 10, 60);
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
    for (let i = 0; i < population.rockets.length; i++) {
        if (population.rockets[i].completed) {
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

    this.checkCollision = function (rocketX, rocketY) {
        return (rocketX > this.x && rocketX < this.x + this.w && rocketY > this.y && rocketY < this.y + this.h);
    }
}

function Rocket(dna) {
    this.pos = createVector(width/2, height);
    this.vel = createVector();
    this.acc = createVector();
    this.fitness = 0;
    this.completed = false;
    this.crashed = false;

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
        if(this.completed) {
            this.fitness *= 10;
        }
        if(this.crashed) {
            this.fitness /= 10;
        }
    }

    this.update = function () {
        if (this.completed || this.crashed) {
            return;
        }

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

        this.applyForce(this.dna.genes[count]);
        if(!this.completed && !this.crashed){
            this.vel.add(this.acc);
            this.pos.add(this.vel);
            this.acc.mult(0);
            this.vel.limit(4);
        }
    }

    this.show = function () {
        push();
        noStroke();
        fill(255, 150);
        translate(this.pos.x, this.pos.y);
        rotate(this.vel.heading());
        rectMode(CENTER);
        rect(0, 0, 30, 15);
        pop();
    }
}

function Population() {
    this.rockets = [];
    this.popsize = 100;
    this.matingpool = [];

    for (let i = 0; i < this.popsize; i++) {
        this.rockets[i] = new Rocket();
    }

    this.evaluate = function() {
        let maxfit = 0;
        for (let i = 0; i < this.popsize; i++) {
            this.rockets[i].calcFitness();
            if(this.rockets[i].fitness > maxfit){
                maxfit = this.rockets[i].fitness;
            }
        }
        maxFit = maxfit;

        if(maxFit > maxGottenFitness){
            maxGottenFitness = maxFit;
        }

        //createP(maxfit);
        //console.log(this.rockets);

        for (let i = 0; i < this.popsize; i++) {
            this.rockets[i].fitness /= maxfit;
        }

        this.matingpool = [];
        for (let i = 0; i < this.popsize; i++) {
            let n = this.rockets[i].fitness * 100;
            for (let j = 0; j < n; j++) {
                this.matingpool.push(this.rockets[i]);
            }
        }
    }

    this.selection = function () {
        let newRockets = [];
        for (let i = 0; i < this.rockets.length; i++) {
            let parentA = random(this.matingpool).dna;
            let parentB = random(this.matingpool).dna;
            let child = parentA.crossover(parentB);
            child.mutation();
            newRockets[i] = new Rocket(child);
        }
        this.rockets = newRockets;
    }

    this.run = function (){
        let allCrashed = true;
        let allCompleted = true;

        for (let i = 0; i < this.popsize; i++) {
            this.rockets[i].update();
            this.rockets[i].show();

            if (!this.rockets[i].completed) {
                allCompleted = false;
            }
            if (!this.rockets[i].crashed) {
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