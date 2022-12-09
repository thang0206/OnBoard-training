import {HttpErrors} from '@loopback/rest';
import * as isEmail from 'isemail';
import { Task } from '../models';
import {Credentials, ProjectUserRepository, TaskRepository, UserRepository} from '../repositories/index';

export async function validateCredentials(credentials: Credentials, userRepository: UserRepository) {
  if (!isEmail.validate(credentials.email)) {
    throw new HttpErrors.UnprocessableEntity('invalid Email');
  }
  const foundUser = await userRepository.findOne({
    where: {
      email: credentials.email
    }
  });
  if (foundUser !== null) {
    throw new HttpErrors.UnprocessableEntity('this email already exists');
  }
  if (credentials.email.length < 8) {
    throw new HttpErrors.UnprocessableEntity('email length should be greater than 8');
  }
  if (credentials.password.length < 8) {
    throw new HttpErrors.UnprocessableEntity("passwordd length should be greater than 8");
  }
  if (foundUser) {
    throw new HttpErrors.UnprocessableEntity('this email already exists');
  }
}

export async function validateProject(userId: string, projectId: string, projectUserRepository: ProjectUserRepository) {
  const projectUser = await projectUserRepository.findOne({
    where: {
      userId,
      projectId,
    }
  });
  if (!projectUser) {
    throw new HttpErrors.UnprocessableEntity('project not found');
  }
  return projectUser;
}

export async function validateUser(task: Task, taskRepository: TaskRepository, ) {

}