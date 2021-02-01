import { animate, style, transition, trigger } from '@angular/animations';

export const enterLeave = (
  start: {[key: string]: string | number},
  end: {[key: string]: string | number},
  ms = 250
) => trigger(
  'enterLeave',
  [
    transition(
      ':enter',
      [
        style(start),
        animate(`${ms}ms ease-in`,
          style(end)
        )
      ]
    ),
    transition(
      ':leave',
      [
        style(end),
        animate(`${Math.floor(ms / 1.5)}ms ease-out`,
          style(start)
        )
      ]
    )
  ]
);
