import {inject} from '@loopback/core';
import {repository} from '@loopback/repository';
import {getModelSchemaRef, post, requestBody} from '@loopback/rest';
import * as _ from 'lodash';
import {UserServiceBindings, PasswordHasherBindings, TokenServiceBindings} from '../keys';
import {User, UserCredential} from '../models';
import {Credentials, UserCredentialRepository, UserRepository} from '../repositories';
import {BcryptHasher} from '../services/hash.password';
import {JWTService} from '../services/jwt-service';
import {MyUserService} from '../services/user-service';
import {validateCredentials} from '../services/validator-service';

export class AuthController {
  constructor(
    @repository(UserRepository)
    public userRepository: UserRepository,

    @repository(UserCredentialRepository)
    public userCredentialRepository: UserCredentialRepository,

    @inject(PasswordHasherBindings.PASSWORD_HASHER)
    public hasher: BcryptHasher,

    @inject(UserServiceBindings.USER_SERVICE)
    public userService: MyUserService,

    @inject(TokenServiceBindings.TOKEN_SERVICE)
    public jwtService: JWTService,

  ) {}

  @post('/sign-up', {
    responses: {
      '200': {
        description: 'User sign up',
        content: {
          'application/json': {
            schema: getModelSchemaRef(User)
          }
        }
      }
    }
  })
  async signup(
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(User, {
            title: 'NewUser',
            exclude: ['id','createdAt', 'updatedAt'],
          }),
        },
      },
    })
    userData: User){
        await validateCredentials(_.pick(userData, ['email', 'password']), this.userRepository);
        userData.password = await this.hasher.hashPassword(userData.password);
        const savedUser = await this.userRepository.create(userData);
        await this.userCredentialRepository.create({
          password: savedUser.password,
          userId: savedUser.id
        })
        return _.omit(savedUser, 'password');
    }

  @post('/log-in', {
    responses: {
      '200': {
        description: 'Token',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                token: {
                  type: 'string'
                }
              }
            }
          }
        }
      }
    }
  })
  async login(
    @requestBody() credentials: Credentials,
  ): Promise<{token: string}> {
    const user = await this.userService.verifyCredentials(credentials);
    const userProfile = this.userService.convertToUserProfile(user);

    const token = await this.jwtService.generateToken(userProfile);
    return Promise.resolve({token: token});
  }
}
