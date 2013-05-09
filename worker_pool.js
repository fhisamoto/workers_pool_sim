var Job = function() {
  var gaussRandom = function () {
     var u = 2 * Math.random() - 1;
     var v = 2 * Math.random() - 1;
     var r = u * u + v * v;
     if (r == 0 || r > 1) return gaussRandom();
     var c = Math.sqrt(-2 * Math.log(r) / r);
     return u * c;
  }
  this.processTime = (gaussRandom() * 0.0) + 120.0;
  this.startTime = (new Date()).getTime();
  this.endTime = null;
  this.execute = function(onComplete) {
    var job = this;
    return setTimeout(function() {
      job.endTime = (new Date()).getTime();
      var totalTime =  job.endTime - job.startTime;
      onComplete(totalTime);
    }, this.processTime);
  };
  return this;
};

var Worker = function(workerId) {
  this.workerId = workerId;
  this.jobs = [];
  this.MAX_JOBS = 10;

  this.totalTime = 0;
  this.totalTime2 = 0;
  this.numJobs = 0;

  this.idle = function() {
    return (this.jobs.length == 0);
  };

  this.pullJobs = function() {
    var worker = this;
    if (this.jobs[0]) {
      var id = this.jobs[0].execute(function(totalTime) {
        worker.jobs.shift();
        worker.totalTime += totalTime;
        worker.totalTime2 += totalTime * totalTime;
        worker.numJobs += 1;

        // console.log("Job[" + id + "] Completed.");
        var percent = (worker.jobs.length / worker.MAX_JOBS) * 100;
        $('#' + worker.workerId).css('width',  percent + '%');

        worker.pullJobs();
      });
    }
  };

  this.addJob = function(job) {
    if (this.idle()) {
      this.jobs.push(job);
      this.pullJobs();
    } else {
      this.jobs.push(job);
    }
  };
  return this;
}

var Summary = function(numJobs, totalTime, totalTime2) {
  this.numJobs = numJobs;
  this.totalTime = totalTime;
  this.totalTime2 = totalTime2;
  this.average =  function() {
    if (this.numJobs > 0) {
      return this.totalTime / this.numJobs;
    }
    return 0;
  };

  this.standardDeviation = function() {
    if (this.average() > 0) {
      return Math.sqrt(this.totalTime2 / this.numJobs - (this.average() * this.average()));
    }
    return 0;
  };
}

var RoundRobinStrategy = function() {
  this.nextWorker = 0;

  this.addJob = function(job, workers) {
    if (this.nextWorker < workers.length - 1) {
      this.nextWorker = this.nextWorker + 1;
    } else {
      this.nextWorker = 0;
    }
    workers[this.nextWorker].addJob(job);
  };
};

var RandomWorkerStrategy= function() {
  this.addJob = function(job, workers) {
    var j = Math.floor(Math.random() * workers.lenght);
    workers[j].addJob(job);
  };
};

var FirstAvailableStrategy = function() {
  this.addJob = function(job, workers) {
    for (var k = 0; k < workers.length; k++) {
      if ( workers[k].idle() ){
        workers[k].addJob(job);
        return;
      }
    }
  };
};

var WorkersPool = function(options) {
  this.MAX_WORKERS = (options && options.numWorkers) ? options.numWorkers : 30;
  this.strategy = (options && options.strategy) ? options.strategy : new RoundRobinStrategy();
  this.workers = [];

  for (var i = 0; i < this.MAX_WORKERS; i++) {
    var workerId = "worker_" + i;
    this.workers.push(new Worker(workerId));
  }

  this.addJob = function(job) {
    this.strategy.addJob(job, this.workers);
  };

  this.totalTime = 0;
  this.totalTime2 = 0;
  this.numJobs = 0;

  this.summarize = function() {
    for( var i = 0; i < this.MAX_WORKERS; i++ ) {
      this.totalTime += this.workers[i].totalTime;
      this.totalTime2 += this.workers[i].totalTime2;
      this.numJobs += this.workers[i].numJobs;
    }
    return(new Summary(this.numJobs, this.totalTime, this.totalTime2));
  };

  return this;
};
