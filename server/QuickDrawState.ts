import { Schema, type } from '@colyseus/schema';

export class QuickDrawState extends Schema {
  @type('string')
  roomId: string = '';

  @type('string')
  code: string = '';
}
