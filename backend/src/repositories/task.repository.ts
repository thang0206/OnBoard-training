import {inject, Getter} from '@loopback/core';
import {DefaultCrudRepository, repository, BelongsToAccessor} from '@loopback/repository';
import {DatabaseDataSource} from '../datasources';
import {Task, TaskRelations, User} from '../models';
import {UserRepository} from './user.repository';

export class TaskRepository extends DefaultCrudRepository<
  Task,
  typeof Task.prototype.id,
  TaskRelations
> {

  public readonly assignee: BelongsToAccessor<User, typeof Task.prototype.id>;

  public readonly link: BelongsToAccessor<Task, typeof Task.prototype.id>;

  public readonly creator: BelongsToAccessor<User, typeof Task.prototype.id>;

  public readonly updater: BelongsToAccessor<User, typeof Task.prototype.id>;

  constructor(
    @inject('datasources.database') dataSource: DatabaseDataSource, @repository.getter('UserRepository') protected userRepositoryGetter: Getter<UserRepository>, @repository.getter('TaskRepository') protected taskRepositoryGetter: Getter<TaskRepository>,
  ) {
    super(Task, dataSource);
    this.updater = this.createBelongsToAccessorFor('updater', userRepositoryGetter,);
    this.registerInclusionResolver('updater', this.updater.inclusionResolver);
    this.creator = this.createBelongsToAccessorFor('creator', userRepositoryGetter,);
    this.registerInclusionResolver('creator', this.creator.inclusionResolver);
    this.link = this.createBelongsToAccessorFor('link', taskRepositoryGetter,);
    this.registerInclusionResolver('link', this.link.inclusionResolver);
    this.assignee = this.createBelongsToAccessorFor('assignee', userRepositoryGetter,);
    this.registerInclusionResolver('assignee', this.assignee.inclusionResolver);
  }
}
