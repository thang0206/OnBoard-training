import {Entity, model, property, belongsTo} from '@loopback/repository';
import {EStatus} from '../constants'
import {User} from './user.model';
import {Project} from './project.model';

@model()
export class Task extends Entity {
  @property({
    type: 'string',
    id: true,
    generated: true,
  })
  id?: string;

  @property({
    type: 'string',
    required: true,
  })
  title: string;

  @property({
    type: 'boolean',
    required: true,
  })
  isCreatedByAdmin: boolean;

  @property({
    type: 'string',
    jsonSchema: {
      enum: Object.values(EStatus),
    },
  })
  status?: EStatus;

  @property({
    type: 'string',
  })
  description?: string;

  @property({
    type: 'Date',
    default: new Date()
  })
  createdAt?: Date

  @property({
    type: 'Date',
    default: new Date()
  })
  updatedAt?: Date

  @property({
    type: 'string',
  })
  userId?: string;

  @property({
    type: 'string',
  })
  tasks?: string;

  @belongsTo(() => User, {name: 'assignee'})
  assignedTo: string;

  @belongsTo(() => Task, {name: 'link'})
  linkedTo: string;

  @belongsTo(() => User, {name: 'creator'})
  createdBy: string;

  @belongsTo(() => User, {name: 'updater'})
  updatedBy: string;

  @belongsTo(() => Project)
  projectId: string;

  constructor(data?: Partial<Task>) {
    super(data);
  }
}

export interface TaskRelations {
  // describe navigational properties here
}

export type TaskWithRelations = Task & TaskRelations;
