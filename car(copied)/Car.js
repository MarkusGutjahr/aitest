class Car {
    constructor() {
        this.carImg = carImg;
        this.velocity = p5.Vector.random2D();
        this.genotype = new DNA();
        this.r = 15;
        this.index = 0;
        this.pos = createVector(width/2, height - 325);
        this.angle = 0;
        this.rotateAmount = 0;
        this.alive = true;
        this.currentCheckpoint = 0;
    }

    die() {
        this.alive = false;
    }

    draw() {
        if (!this.alive) return;


        push();
        translate(this.pos.x, this.pos.y);
        rotate(this.angle);

        if (this.wasBest) {
            tint(0, 255, 100);
        }
        imageMode(CENTER);
        image(carImg, 0, 0, this.r + 10, this.r);
        pop();
    }

    update() {
        if (!this.alive) return;
        this.pos.x -= SPEED * cos(this.angle);
        this.pos.y -= SPEED * sin(this.angle);
        this.angle += this.genotype.genes[this.index];
        this.index++;
    }

    calcFitness() {
        //this.genotype.calcFitness(this.index);
        this.genotype.calcFitness(this.currentCheckpoint);
    }

    crossover(partner) {
        let childCar = new Car();
        childCar.genotype = this.genotype.crossover(partner.genotype);
        return childCar;
    }

    fitness() {
        return this.genotype.fitness;
    }

    mutate(mutationRate) {
        this.genotype.mutate(mutationRate);
    }
}