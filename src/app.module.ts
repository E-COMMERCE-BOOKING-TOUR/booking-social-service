import { Module, OnModuleInit } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { InjectConnection, MongooseModule } from '@nestjs/mongoose';
import { Connection } from 'mongoose';
import { ArticleModule } from './module/article/article.module';
import { FollowModule } from './module/follow/follow.module';

@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
        }),
        MongooseModule.forRootAsync({
            imports: [ConfigModule],
            useFactory: async (configService: ConfigService) => ({
                uri: configService.get<string>('MONGODB_URI'),
            }),
            inject: [ConfigService],
        }),
        ArticleModule,
        FollowModule,
    ],
    controllers: [],
    providers: [],
})
export class AppModule implements OnModuleInit {
    constructor(
        private configService: ConfigService,
        @InjectConnection() private connection: Connection,
    ) { }

    async onModuleInit() {
        const uri = this.configService.get<string>('MONGODB_URI');
        const connectionState = this.connection.readyState;
        const states = {
            0: 'disconnected',
            1: 'connected',
            2: 'connecting',
            3: 'disconnecting',
            99: 'uninitialized',
        };
        console.log('MongoDB URI:', uri);
        console.log('MongoDB Connection Status:', states[connectionState] || connectionState);

        try {
            if (this.connection.readyState === 1 && this.connection.db) {
                const collections = await this.connection.db.listCollections().toArray();
                console.log('Collections:', collections.map(c => c.name));
            } else {
                console.log('Database not ready or undefined, cannot list collections yet.');
            }
        } catch (error) {
            console.error('Failed to list collections:', error);
        }
    }
}