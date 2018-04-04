import Controller from '@ember/controller';
import { task, timeout, all} from 'ember-concurrency';
import computed from 'ember-macro-helpers/computed'
import EmberObject from '@ember/object'
import { A as a } from '@ember/array';

const NUM_ACTIONS = 8

const TrialTracker = EmberObject.extend({
    id: null,
    history: [],
    sum: 0,
    state: null,
    results: [0],
    type: null,
    progress: 0
});

export default Controller.extend({
    selectedBasicTab: "",
    trackers: [],
    position: 0,
    status: "",
    types: ["tsetlin","krinsky","krylov","lri"],
    chartTypes: ["bar","polarArea","pie"],
    selectedType: "tsetlin",
    chartType: "polarArea",
    chartOptions: {
        scales: {
            yAxes:[{
                type: 'logarithmic'
            }]
        }
    },
    iterations: 15000,
    ensemble: 5000,
    numTrials: 10,
    fastMode: false,
    n: 10,
    teacher: [7,8,4,3,5,6,1,2],
    dishCoords: "150 160,250 160,200 200",
    results: {},
    fsmTask: task(function * (testType) {
        let allDone = all;
        let trackers = [], childTasks = [];
        let numTrials = this.get('numTrials')
        for(let i = 0; i < numTrials; i++){
            let tracker = TrialTracker.create({ id: testType + '_' + i, type: testType })

            trackers.push(tracker)
            childTasks.pushObject(this.get('trialTask').perform(tracker))
        }

        this.set('trackers', trackers)
        this.set('status', "Waiting for trials to complete...");
        let trials = yield all(childTasks)
        this.set('status', 'Complete! The results are...')
        let x = {}
        for (let i = 0; i< numTrials; i++) {
            for (let r in trials.results){
                x[r] = x[r] ? trials[i][r] + x[r] : trials[i][r] 
            }

        }
    }),
    trialTask: task(function * (tracker) {
        let fastMode = this.get('fastMode')
        let history = [this.get('n')]
        let iterations = this.get('iterations')
        let ensemble = this.get('ensemble')
        let n = this.get('n')
        let results = {}
        let lriWeights = [0.125,0.125,0.125,0.125,0.125,0.125,0.125,0.125]
        while (history.length < iterations) {
            let state = history[history.length-1]
            let action = Math.ceil(state/n)-1
            if(Math.ceil(state/n)-1 > NUM_ACTIONS-1){
                debugger
            }
            let signal = this.askTeacher(action)
            if(isNaN(signal)){
                debugger
            }
            tracker.set('sum', tracker.get('sum') + signal)
            let average = tracker.sum/history.length
            if(tracker.type == 'tsetlin'){
                state = this.tsetlin(state, signal > average)
            }else if(tracker.type == 'krinsky'){
                state = this.krinksky(state, signal > average)
            }else if(tracker.type == 'krylov'){
                state = this.krylov(state, signal > average)
            }else if(tracker.type == 'lri'){
                if(signal > average){
                    let sum = 1
                    for(let i = 0; i<lriWeights.length; i++){
                        if(i != action){
                            lriWeights[i] = lriWeights[i]*0.9
                            sum = sum - lriWeights[i]
                        }
                    }
                    lriWeights[action] = sum
                }
                state = this.lri(lriWeights, state, signal > average)
            }

            history = (tracker.history).concat([state])
            if(history.length > iterations-ensemble){
                results[action] ? results[action]++ : results[action] = 1
            }
            tracker.set('progress', (history.length/iterations)*100);
            tracker.set('history', history);
            

            if(!fastMode && history.length % 1000 == Math.floor(Math.random() * 1000)){
                yield timeout(1)
            }
        }

        tracker.set('results', results);
        let x = this.get('results')
        for(let j in results){
            results[j] = x[j] ? x[j] + results[j] : results[j] 
        }
        this.set('results', results)
        yield timeout(1)
        return tracker;
    }).enqueue().maxConcurrency(10),
    
    tsetlin (state, reward) {
        let n = this.get('n')
        if(reward){
            if(state%n != 1){
                return state - 1
            }else {
                return state 
            }
        }else{
            if(state%n == 0){
                return (state + n > n*NUM_ACTIONS ? n : state + n)
            }else {
                return state + 1
            }
        }
    },

    krinksky (state, reward) {
        let n = this.get('n')
        if(reward){
            if(state%n != 1){
                return state - (state%n - 1)
            }else {
                return state 
            }
        }else{
            if(state%n == 0){
                return (state + n > n*NUM_ACTIONS ? n : state + n)
            }else {
                return state + 1
            }
        }
    },

    krylov (state, reward) {
        let n = this.get('n')
        if(reward || Math.random() >= 0.5){
            if(state%n > 1){
                return state - (state%n - 1)
            }else {
                return state 
            }
        }else{
            if(state%n == 0){
                return (state + n > n*NUM_ACTIONS ? n : state + n)
            }else {
                return state + 1
            }
        }
    },

    lri (weights, action, reward) {
        let n = this.get('n')
        let x = Math.random()
        let total = 0
        for(let i = 0; i<weights.length; i++){
            total += weights[i]
            if(x < total){
                return i*n +1
            }
        }
    },

    askTeacher (action) {
        let weights = this.get('teacher')
        return ((3*weights[action])/2) + this.randn_bm();
    },

    updateRes (res) {
        let results = this.get('results')
        for (var property in res) {
            results[property] = results[property] ? results[property] + res[property] : res[property]
        }
        this.set('results',results)
    },

    resultsData: computed('results.[0]', function(){
        let results = this.get('results')
        let datasets = {
            label: "Frequency of direction", 
            backgroundColor: [
                'rgba(255, 99, 132, 0.2)',
                'rgba(54, 162, 235, 0.2)',
                'rgba(255, 206, 86, 0.2)',
                'rgba(75, 192, 192, 0.2)',
                'rgba(153, 102, 255, 0.2)',
                'rgba(255, 159, 64, 0.2)'
            ],
            data:[]
        }
        let labels = []
        if(Object.keys(results).length < 1){
            return null
        }
        datasets.labels = []
        for(let i in results){
            labels.push(i)
            datasets.data.push(results[i])
        }
        return {
            labels,
            datasets: [datasets]
        }
    }),

    updateDish (pos) {
        switch(pos) {
            case 0:
                this.set('dishCoords', "150 160,250 160,200 200")
                break;
            case 1:
                this.set('dishCoords', "200 120,270 200,200 200")
                break;
            case 2:
                this.set('dishCoords', "240 150,240 250,200 200")
                break;
            case 3:
                this.set('dishCoords', "200 280,270 200,200 200")
                break;
            case 4:
                this.set('dishCoords', "150 240,250 240,200 200")
                break;
            case 5:
                this.set('dishCoords', "200 280,130 200,200 200")
                break;
            case 6:
                this.set('dishCoords', "160 150,160 250,200 200")
                break;
            case 7:
                this.set('dishCoords', "200 120,130 200,200 200")
                break;
            default:
                this.set('dishCoords', "150 160,250 160,200 200")
        }
    },

    randn_bm() {
        var u = 0, v = 0;
        while(u === 0) u = Math.random(); //Converting [0,1) to (0,1)
        while(v === 0) v = Math.random();
        return Math.sqrt( -2.0 * Math.log( u ) ) * Math.cos( 2.0 * Math.PI * v );
    },

    shuffle(a) {
        var j, x, i;
        for (i = a.length - 1; i > 0; i--) {
            j = Math.floor(Math.random() * (i + 1));
            x = a[i];
            a[i] = a[j];
            a[j] = x;
        }
        return a
    },

    actions: {
        changePos() {
            let p = (this.get('position')+1)%8
            this.set('position', p)
            this.updateDish(p)
        },
        doTrials(mode) {
            this.get('fsmTask').perform(mode)
        },
        update(newOrder, draggedModel) {
            this.set('teacher', a(newOrder));
            this.set('dragged', draggedModel);
          }
    }
});
