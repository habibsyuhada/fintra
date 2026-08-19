import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAccessGuard } from '../auth/guards/jwt-access.guard';
import {
  CurrentUser,
  type RequestUser,
} from '../common/decorators/current-user.decorator';
import { ArticlesService } from './articles.service';
import { QueryArticleDto } from './dto/query-article.dto';
import { UpdateArticleDto } from './dto/update-article.dto';

@UseGuards(JwtAccessGuard)
@Controller('articles')
export class ArticlesController {
  constructor(private readonly articlesService: ArticlesService) {}

  @Get()
  findAll(@Query() query: QueryArticleDto) {
    return this.articlesService.findAll(query);
  }

  @Get(':idOrSlug')
  findOne(@Param('idOrSlug') idOrSlug: string) {
    return this.articlesService.findOne(idOrSlug);
  }

  @Patch(':idOrSlug')
  update(
    @CurrentUser() user: RequestUser,
    @Param('idOrSlug') idOrSlug: string,
    @Body() dto: UpdateArticleDto,
  ) {
    return this.articlesService.update(user.userId, idOrSlug, dto);
  }
}
