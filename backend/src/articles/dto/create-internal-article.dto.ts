import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
  MinLength,
  ValidateNested,
} from 'class-validator';

export class ArticleSourceDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(300)
  title: string;

  @IsUrl({ require_protocol: true })
  url: string;
}

export class CreateInternalArticleDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  title: string;

  @IsString()
  @MinLength(400)
  bodyMd: string;

  @IsArray()
  @ArrayMaxSize(6)
  @ValidateNested({ each: true })
  @Type(() => ArticleSourceDto)
  @IsOptional()
  sources?: ArticleSourceDto[];
}
