import { Component } from '@angular/core';

import { CountService, CountActionType } from './count.service';

@Component({
  selector: 'my-app',
  templateUrl: './app.component.html',
  styleUrls: [ './app.component.css' ]
})
export class AppComponent  {

  actionType = CountActionType;

  constructor(
    public count: CountService,
  ) {}

}
