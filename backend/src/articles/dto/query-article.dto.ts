import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, Max, Min } from 'class-validator';

export class QueryArticleDto {
  @IsIn(['UNREAD', 'READ', 'FAVORIT'])
  @IsOptional()
  status?: 'UNREAD' | 'READ' | 'FAVORIT';

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  page?: number;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  @IsOptional()
  limit?: number;
}
