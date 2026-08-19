import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { InternalApiKeyGuard } from '../auth/guards/internal-api-key.guard';
import { ArticlesService } from './articles.service';
import { CreateInternalArticleDto } from './dto/create-internal-article.dto';

/** Separate controller (own guard) from ArticlesController, which requires a
 * user JWT — this endpoint is called by the daily article-generator Routine,
 * where no human is logged in. */
@UseGuards(InternalApiKeyGuard)
@Controller('articles/internal')
export class ArticlesInternalController {
  constructor(private readonly articlesService: ArticlesService) {}

  @Post()
  create(@Body() dto: CreateInternalArticleDto) {
    return this.articlesService.createFromGenerator(dto);
  }
}
