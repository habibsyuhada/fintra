import { IsBoolean } from 'class-validator';

export class UpdateTopicDto {
  @IsBoolean()
  done: boolean;
}
