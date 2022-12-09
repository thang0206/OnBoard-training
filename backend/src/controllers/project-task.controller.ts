import { authenticate, AuthenticationBindings } from '@loopback/authentication';
import { inject } from '@loopback/core';
import {UserProfile} from '@loopback/security';
import {
  Count,
  CountSchema,
  Filter,
  repository,
  Where,
} from '@loopback/repository';
import {
  del,
  get,
  getModelSchemaRef,
  getWhereSchemaFor,
  HttpErrors,
  param,
  patch,
  post,
  requestBody,
} from '@loopback/rest';
import {
  Task,
} from '../models';
import {ProjectRepository, ProjectUserRepository, TaskRepository} from '../repositories';
import { validateProject } from '../services/validator-service';
import _ from 'lodash';
import { ERole, EStatus } from '../constants';
import { UserRepository } from '@loopback/authentication-jwt';

@authenticate('jwt')
export class ProjectTaskController {
  constructor(
    @repository(ProjectRepository) 
    protected projectRepository: ProjectRepository,

    @repository(ProjectUserRepository)
    public projectUserRepository: ProjectUserRepository,

    @repository(TaskRepository)
    public taskRepository: TaskRepository,

    @repository(UserRepository)
    public userRepository: UserRepository,
  ) { }

  @get('/projects/{projectId}/tasks', {
    responses: {
      '200': {
        description: 'Array of Project has many Task',
        content: {
          'application/json': {
            schema: {type: 'array', items: getModelSchemaRef(Task)},
          },
        },
      },
    },
  })
  async find(
    @inject(AuthenticationBindings.CURRENT_USER)
    currentUser: UserProfile,
    @param.path.string('projectId') projectId: string,
    @param.query.object('filter') filter?: Filter<Task>,
  ): Promise<Task[]> {
    const userId: string = currentUser?.id;
    const currentProjectUser = await validateProject(userId, projectId, this.projectUserRepository)

    const userRole = currentProjectUser.role;
    if (userRole !== ERole.ADMIN) {
      return this.taskRepository.find({
        where: {
          projectId, 
          isCreatedByAdmin: false,
        }
      })
    }
    else {
      return this.taskRepository.find({where: {projectId}})
    }  
  }

  @post('/projects/{projectId}/tasks', {
    responses: {
      '200': {
        description: 'Project model instance',
        content: {'application/json': {schema: getModelSchemaRef(Task)}},
      },
    },
  })
  async create(
    @inject(AuthenticationBindings.CURRENT_USER)
    currentUser: UserProfile,
    @param.path.string('projectId') projectId: string,
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(Task, {
            title: 'NewTaskInProject',
            exclude: ['id', 'isCreatedByAdmin', 'createdAt', 'updatedAt', 'assignedTo', 'linkedTo', 'createdBy', 'updatedBy', 'projectId', 'userId', 'tasks'],
          }),
        },
      },
    }) task: Omit<Task, 'id'>,
  ): Promise<Task> {
    const userId: string = currentUser?.id;
    const currentProjectUser = await validateProject(userId, projectId, this.projectUserRepository)

    _.set(task, 'isCreatedByAdmin', currentProjectUser?.role === ERole.ADMIN)
    _.set(task, 'status', EStatus.TODO)
    _.set(task, 'createdBy', userId)
    _.set(task, 'updatedBy', userId)

    return this.projectRepository.tasks(projectId).create(task);
  }

  @patch('/projects/{projectId}/tasks/{taskId}', {
    responses: {
      '200': {
        description: 'Project.Task PATCH success count',
        content: {'application/json': {schema: CountSchema}},
      },
    },
  })
  async patch(
    @inject(AuthenticationBindings.CURRENT_USER)
    currentUser: UserProfile,
    @param.path.string('projectId') projectId: string,
    @param.path.string('taskId') taskId: string,
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(Task, {
            partial: true,
            exclude: ['id', 'createdAt', 'updatedAt', 'createdBy', 'updatedBy']
          }),
        },
      },
    })
    task: Task,
  ): Promise<void> {
    const userId = currentUser.id;
    const currentProjectUser = await validateProject(userId, projectId, this.projectUserRepository)

    let isCreatedByAdmin = currentProjectUser?.role === ERole.ADMIN
    if (task?.assignedTo) {
      if (!isCreatedByAdmin) {
        throw new HttpErrors.UnprocessableEntity('Not allow to assign task');
      }
      else {
        const foundedUser = await this.userRepository.findById(task.assignedTo);
        if (!foundedUser) {
          throw new HttpErrors.NotFound('User assigned to is no valid');
        }
      }
    }

    _.set(task, 'updatedBy', userId);
    _.set(task, 'updatedAT', new Date());

    await this.taskRepository.updateById(taskId, task);
  }

  @del('/projects/{projectId}/tasks', {
    responses: {
      '200': {
        description: 'Project.Task DELETE success count',
        content: {'application/json': {schema: CountSchema}},
      },
    },
  })
  async delete(
    @param.path.string('projectId') projectId: string,
    @param.query.object('where', getWhereSchemaFor(Task)) where?: Where<Task>,
  ): Promise<Count> {
    return this.projectRepository.tasks(projectId).delete(where);
  }
}
