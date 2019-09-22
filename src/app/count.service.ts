import { Injectable } from '@angular/core';
import { BehaviorSubject, merge, interval, NEVER, Observable, defer } from 'rxjs';
import { mapTo, startWith, scan, pluck, distinctUntilChanged, map, switchMap, tap, withLatestFrom, shareReplay, filter, mergeMap } from 'rxjs/operators';

/*
Objectives:
1. should have a reference number to add to the counter that can be updated realtime
2. should have a reference update speed from counter that can be updated realtime
3. should be able to manually set the counter without stop the process
4. should be able to count down
*/

export enum CountActionType {
  UpdateCountDiff,
  UpdateCountSpeed,
  UpdateCount,
  CountDown,
  CountUp,
  Pause,
  Reset,
  Add,
  Subtract,
}

export interface CountState {
  count: number,
  countDiff: number,
  timeout: number
}

export interface CountAction {
  actionType: CountActionType,
  payload?: any,
}

const initialState: CountState = {
  count: 0,
  countDiff: 1,
  timeout: 1000
};

@Injectable()
export class CountService {

constructor() {
  this.interval$ = this.getInterval(1000);
}
  private actions$ = new BehaviorSubject<CountAction>({
    actionType: CountActionType.Reset
  });

  private interval$ : Observable<any>;

  state$: Observable<CountState> = merge(
    this.actions$,
    defer(() => this.timerCount$),
  ).pipe(
    scan((state: CountState, { actionType, payload }: CountAction) => {
      switch (actionType) {
        case CountActionType.Add:
          return { ...state, count: state.count + state.countDiff };
        case CountActionType.Subtract:
          return { ...state, count: state.count - state.countDiff };
        case CountActionType.Reset:
          return { ...initialState };
        case CountActionType.UpdateCountDiff:
          return { ...state, countDiff: parseInt(payload)}
        case CountActionType.UpdateCountSpeed:
          return { ...state, timeout: parseInt(payload)}
        case CountActionType.UpdateCount:
          return { ...state, count: (parseInt(payload) || 0)}
      }
      return state;
    }, { ...initialState }),
  );

  timerCount$ = this.actions$.pipe(
    filter(({actionType}) =>
      actionType === CountActionType.CountUp ||
      actionType === CountActionType.CountDown ||
      actionType === CountActionType.UpdateCountSpeed ||
      actionType === CountActionType.Pause),
    switchMap(({actionType, payload}) =>{
      let obs: any ;
      switch (actionType) {
        case CountActionType.CountUp: 
          obs = this.interval$.pipe(
            map(()=>this.buildAction(CountActionType.Add))
          );
        break;
        case CountActionType.UpdateCountSpeed: 
          this.interval$ = this.getInterval(parseInt(payload) || 1000);
          obs = this.interval$.pipe(
            map(()=>this.buildAction(CountActionType.Add))
          );
        break;
        case CountActionType.Pause: 
          obs = NEVER;
        break;
        case CountActionType.CountDown: 
          obs = this.interval$.pipe(
            map(()=>this.buildAction(CountActionType.Subtract))
          );
        break;
      }

      return obs;
    }),

    // map(() => this.buildAction(CountActionType.Add)),
  )

  dispatch(actionType: CountActionType, payload?: any) {
    this.actions$.next(this.buildAction(actionType, payload));
  }

  getInterval(time) {
    return interval(time);
  }

  private buildAction(actionType: CountActionType, payload?: any): CountAction {
    return {
      actionType,
      payload,
    };
  }

}