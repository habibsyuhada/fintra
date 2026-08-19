import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateTopicDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(300)
  topic: string;

  @IsString()
  @IsOptional()
  @MaxLength(2000)
  context?: string;
}
