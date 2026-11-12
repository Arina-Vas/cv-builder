import { Module } from '@nestjs/common';
import { FilesModule } from '@/files/files.module';
import { UsersService } from '@/users/users.service';
import { UsersResolver } from '@/users/users.resolver';

@Module({
  imports: [FilesModule],
  providers: [UsersResolver, UsersService],
  exports: [UsersService],
})
export class UsersModule {}
