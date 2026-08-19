import { Module } from '@nestjs/common';
import { ArticlesController } from './articles.controller';
import { ArticlesInternalController } from './articles-internal.controller';
import { ArticlesService } from './articles.service';

@Module({
  controllers: [ArticlesController, ArticlesInternalController],
  providers: [ArticlesService],
})
export class ArticlesModule {}
