import { Module } from '@nestjs/common';
import { SearchHistoryController } from './search-history.controller';
import { SearchHistoryService } from './search-history.service';
import { SearchReminderCron } from './search-reminder.cron';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [NotificationsModule],
  controllers: [SearchHistoryController],
  providers: [SearchHistoryService, SearchReminderCron],
})
export class SearchHistoryModule {}
