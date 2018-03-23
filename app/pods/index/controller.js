import Controller from '@ember/controller';
import { task, timeout, all} from 'ember-concurrency';
import computed from 'ember-macro-helpers/computed'
import EmberObject from '@ember/object'

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
    selectedType: "tsetlin",
    iterations: 15000,
    ensemble: 5000,
    numTrials: 10,
    fastMode: false,
    n: 10,
    teacher: [7,8,4,3,5,6,1,2],
    dishCoords: "150 160,250 160,200 200",
    results: {},
    fsmTask: task(function * (testType) {
        let trackers = [], childTasks = [];
        let numTrials = this.get('numTrials')
        let results = this.get('results')
        for(let i = 0; i < numTrials; i++){
            let tracker = TrialTracker.create({ id: testType + '_' + i, type: testType })

            trackers.push(tracker)
            childTasks.pushObject(this.get('trialTask').perform(tracker))
        }

        this.set('trackers', trackers)
        this.set('status', "Waiting for child tasks to complete...");
        let trials = all(childTasks)
        console.log(trials)
        this.set('status', trials)
    }),
    trialTask: task(function * (tracker) {
        let fastMode = this.get('fastMode')
        let history = [this.get('n')]
        let iterations = this.get('iterations')
        let ensemble = this.get('ensemble')
        let results = {}
        while (history.length < iterations) {
            let state = history[history.length-1]
            let action = Math.ceil(state/this.get('n'))-1
            let signal = this.askTeacher(action)
            tracker.set('sum', tracker.get('sum') + signal)
            let average = tracker.sum/history.length
            if(tracker.type == 'tsetlin'){
                state = this.tsetlin(state, signal > average)
            }else if(tracker.type == 'krinsky'){
                state = this.krinksky(state, signal > average)
            }else if(tracker.type == 'krylov'){
                state = this.krylov(state, signal > average)
            }else if(tracker.type == 'lri'){
                state = this.lri(state, signal > average)
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
        //this.updateRes(results)
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

    askTeacher (action) {
        let weights = this.get('teacher')
        return ((3*weights[action])/2) + this.randn_bm();
    },

    updateRes (res) {
        let results = this.get('results')
        for (var property in res) {
            if (object.hasOwnProperty(property)) {
                //results[property] ? 
            }
        }

    },

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
        }
    }
});
