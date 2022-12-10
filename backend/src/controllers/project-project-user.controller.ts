import { authenticate } from '@loopback/authentication';
import { inject } from '@loopback/core';
import {SecurityBindings, UserProfile} from '@loopback/security';
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
  Project,
  ProjectUser,
} from '../models';
import {ProjectRepository, ProjectUserRepository} from '../repositories';
import { validateProject } from '../services/validator-service';
import { ERole } from '../constants';
import _ from 'lodash';

@authenticate('jwt')
export class ProjectProjectUserController {
  constructor(
    @repository(ProjectRepository) 
    protected projectRepository: ProjectRepository,

    @repository(ProjectUserRepository)
    public projectUserRepository: ProjectUserRepository
  ) { }

  @get('/projects/{id}/project-users', {
    responses: {
      '200': {
        description: 'Array of Project has many ProjectUser',
        content: {
          'application/json': {
            schema: {type: 'array', items: getModelSchemaRef(ProjectUser)},
          },
        },
      },
    },
  })
  async find(
    @param.path.string('id') id: string,
    @param.query.object('filter') filter?: Filter<ProjectUser>,
  ): Promise<ProjectUser[]> {
    return this.projectRepository.projectUsers(id).find(filter);
  }

  @post('/projects/{id}/project-users', {
    responses: {
      '200': {
        description: 'Project model instance',
        content: {'application/json': {schema: getModelSchemaRef(ProjectUser)}},
      },
    },
  })
  async create(
    @inject(SecurityBindings.USER)
    currentUser: UserProfile,
    @param.path.string('id') id: string,
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(ProjectUser, {
            title: 'NewProjectUserInProject',
            exclude: ['id', 'projectId'],
            // optional: ['projectId']
          }),
        },
      },
    }) projectUser: Omit<ProjectUser, 'id'>,
  ): Promise<ProjectUser> {
    const userId = currentUser?.id;
    const currentProjectUser = await validateProject(userId, id, this.projectUserRepository)
    if (currentProjectUser.role !== ERole.ADMIN) {
      throw new HttpErrors.UnprocessableEntity('Can not assign');
    }
    _.set(projectUser, 'projectId', id)
    return this.projectUserRepository.create(projectUser);
  }

  @patch('/projects/{id}/project-users', {
    responses: {
      '200': {
        description: 'Project.ProjectUser PATCH success count',
        content: {'application/json': {schema: CountSchema}},
      },
    },
  })
  async patch(
    @param.path.string('id') id: string,
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(ProjectUser, {partial: true}),
        },
      },
    })
    projectUser: Partial<ProjectUser>,
    @param.query.object('where', getWhereSchemaFor(ProjectUser)) where?: Where<ProjectUser>,
  ): Promise<Count> {
    return this.projectRepository.projectUsers(id).patch(projectUser, where);
  }

  @del('/projects/{id}/project-users', {
    responses: {
      '200': {
        description: 'Project.ProjectUser DELETE success count',
        content: {'application/json': {schema: CountSchema}},
      },
    },
  })
  async delete(
    @param.path.string('id') id: string,
    @param.query.object('where', getWhereSchemaFor(ProjectUser)) where?: Where<ProjectUser>,
  ): Promise<Count> {
    return this.projectRepository.projectUsers(id).delete(where);
  }
}
