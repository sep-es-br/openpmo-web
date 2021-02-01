import { animate, keyframes, style, transition, trigger } from '@angular/animations';

export const bounceInBottom = () => trigger(
  'bounceInBottom',
  [
    transition(
      ':enter',
      [
        animate('500ms', keyframes([
          style({ transform: 'translate3d(0, 300%, 0)', offset: 0 }),
          style({ transform: 'translate3d(0, -10px, 0)', offset: 0.58 }),
          style({ transform: 'translate3d(0, 10px, 0)', offset: 0.73 }),
          style({ transform: 'translate3d(0, -2px, 0)', offset: 0.88 })
        ]))
      ]
    ),
    transition(
      ':leave',
      [
        animate('300ms', style({ transform: 'translate3d(0, 300%, 0)', offset: 1 }))
      ]
    )
  ]
);
