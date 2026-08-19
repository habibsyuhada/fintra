import { IsBoolean, IsIn, IsOptional } from 'class-validator';

export class UpdateArticleDto {
  @IsIn(['UNREAD', 'READ', 'FAVORIT'])
  @IsOptional()
  status?: 'UNREAD' | 'READ' | 'FAVORIT';

  @IsBoolean()
  @IsOptional()
  isPublic?: boolean;
}
