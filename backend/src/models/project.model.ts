import {Entity, model, property, hasMany, belongsTo} from '@loopback/repository';
import {Task} from './task.model';
import {User} from './user.model';
import {ProjectUser} from './project-user.model';

@model()
export class Project extends Entity {
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

  @hasMany(() => Task)
  tasks: Task[];

  @belongsTo(() => User, {name: 'creator'})
  createdBy: string;

  @belongsTo(() => User, {name: 'updater'})
  updatedBy: string;

  @hasMany(() => ProjectUser)
  projectUsers: ProjectUser[];

  constructor(data?: Partial<Project>) {
    super(data);
  }
}

export interface ProjectRelations {
  // describe navigational properties here
}

export type ProjectWithRelations = Project & ProjectRelations;
