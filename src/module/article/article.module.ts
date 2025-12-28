import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Article, ArticleSchema } from './schema/article.schema';
import { Comment, CommentSchema } from './schema/comment.schema';
import { ArticleService } from './service/article.service';
import { ArticleController } from './controller/article.controller';
import { AdminArticleService } from './service/admin-article.service';
import { AdminArticleController } from './controller/admin-article.controller';

@Module({
    imports: [
        MongooseModule.forFeature([
            { name: Article.name, schema: ArticleSchema },
            { name: Comment.name, schema: CommentSchema },
        ]),
    ],
    controllers: [ArticleController, AdminArticleController],
    providers: [ArticleService, AdminArticleService],
})
export class ArticleModule { }
