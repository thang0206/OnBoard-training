import {UserService} from '@loopback/authentication';
import {inject} from '@loopback/core';
import {repository} from '@loopback/repository';
import {HttpErrors} from '@loopback/rest';
import {securityId, UserProfile} from '@loopback/security';
import {PasswordHasherBindings} from '../keys';
import {User, UserCredential} from '../models';
import {Credentials, UserRepository} from '../repositories/user.repository';
import { UserCredentialRepository } from '../repositories/user-creadential.repository';
import {BcryptHasher} from './hash.password';

export class MyUserService implements UserService<User, Credentials>{
  constructor(
    @repository(UserRepository)
    public UserRepository: UserRepository,

    @repository(UserCredentialRepository)
    public UserCredentialRepository: UserCredentialRepository,

    @inject(PasswordHasherBindings.PASSWORD_HASHER)
    public hasher: BcryptHasher

  ) {}
  async verifyCredentials(credentials: Credentials): Promise<User> {
    // implement this method
    const foundUser = await this.UserRepository.findOne({
      where: {
        email: credentials.email
      }
    });
    if (!foundUser) {
      throw new HttpErrors.NotFound('customer not found');
    }
    const passwordMatched = await this.hasher.comparePassword(credentials.password, foundUser.password)
    if (!passwordMatched)
      throw new HttpErrors.Unauthorized('password is not valid');
    return foundUser;
    }
  convertToUserProfile(user: User): UserProfile {
    return {
      [securityId]: user.id!.toString(),
      id: user.id,
      email: user.email,
      password: user.password
    };
    // throw new Error('Method not implemented.');
  }

}
