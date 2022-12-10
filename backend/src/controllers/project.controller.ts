import { authenticate, AuthenticationBindings } from '@loopback/authentication';
import { inject } from '@loopback/core';
import {SecurityBindings, UserProfile} from '@loopback/security';
import {
  Count,
  CountSchema,
  Filter,
  FilterExcludingWhere,
  repository,
  Where,
} from '@loopback/repository';
import {
  post,
  param,
  get,
  getModelSchemaRef,
  patch,
  put,
  del,
  requestBody,
  response,
} from '@loopback/rest';
import _ from 'lodash';
import {Project} from '../models';
import {ProjectRepository, ProjectUserRepository} from '../repositories';
import { ERole } from '../constants';

@authenticate('jwt')
export class ProjectController {
  constructor(
    @repository(ProjectRepository)
    public projectRepository : ProjectRepository,

    @repository(ProjectUserRepository)
    public projectUserRepository: ProjectUserRepository,
  ) {}

  @post('/projects')
  @response(200, {
    description: 'Project model instance',
    content: {'application/json': {schema: getModelSchemaRef(Project)}},
  })
  async create(
    @inject(SecurityBindings.USER)
    currentUser: UserProfile,
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(Project, {
            title: 'NewProject',
            exclude: ['id', 'createdAt', 'updatedAt', 'createdBy'],
          }),
        },
      },
    })
    project: Omit<Project, 'id'>,
  ): Promise<Project> {
    const userId = currentUser.id;
    _.set(project, 'createdBy', userId);
    const savedProject = await this.projectRepository.create(project)
    const savedProjectUser = {
      projectId: savedProject.id,
      userId: userId,
      role: ERole.ADMIN
    }
    await this.projectUserRepository.create(savedProjectUser)
    return savedProject;
  }

  @get('/projects/count')
  @response(200, {
    description: 'Project model count',
    content: {'application/json': {schema: CountSchema}},
  })
  async count(
    @param.where(Project) where?: Where<Project>,
  ): Promise<Count> {
    return this.projectRepository.count(where);
  }

  @get('/projects')
  @response(200, {
    description: 'Array of Project model instances',
    content: {
      'application/json': {
        schema: {
          type: 'array',
          items: getModelSchemaRef(Project, {includeRelations: true}),
        },
      },
    },
  })
  async find(
    @param.filter(Project) filter?: Filter<Project>,
  ): Promise<Project[]> {
    return this.projectRepository.find(filter);
  }

  @patch('/projects')
  @response(200, {
    description: 'Project PATCH success count',
    content: {'application/json': {schema: CountSchema}},
  })
  async updateAll(
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(Project, {partial: true}),
        },
      },
    })
    project: Project,
    @param.where(Project) where?: Where<Project>,
  ): Promise<Count> {
    return this.projectRepository.updateAll(project, where);
  }

  @get('/projects/{id}')
  @response(200, {
    description: 'Project model instance',
    content: {
      'application/json': {
        schema: getModelSchemaRef(Project, {includeRelations: true}),
      },
    },
  })
  async findById(
    @param.path.string('id') id: string,
    @param.filter(Project, {exclude: 'where'}) filter?: FilterExcludingWhere<Project>
  ): Promise<Project> {
    return this.projectRepository.findById(id, filter);
  }

  @patch('/projects/{id}')
  @response(204, {
    description: 'Project PATCH success',
  })
  async updateById(
    @inject(AuthenticationBindings.CURRENT_USER)
    currentUser: UserProfile,
    @param.path.string('id') id: string,
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(Project, {
            partial: true,
            exclude: ['id', 'createdAt', 'updatedAt', 'createdBy', 'updatedBy']
          }),
        },
      },
    })
    project: Project,
  ): Promise<void> {
    const userId = currentUser.id;
    _.set(project, 'updatedBy', userId);
    _.set(project, 'updatedAt', new Date());
    await this.projectRepository.updateById(id, project);
  }

  @put('/projects/{id}')
  @response(204, {
    description: 'Project PUT success',
  })
  async replaceById(
    @param.path.string('id') id: string,
    @requestBody() project: Project,
  ): Promise<void> {
    await this.projectRepository.replaceById(id, project);
  }

  @del('/projects/{id}')
  @response(204, {
    description: 'Project DELETE success',
  })
  async deleteById(@param.path.string('id') id: string): Promise<void> {
    await this.projectRepository.deleteById(id);
  }
}
