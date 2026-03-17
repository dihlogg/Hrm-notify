import { DynamicModule, Module, Type } from "@nestjs/common";
import { HttpModule } from "@nestjs/axios";
import { ProducerService } from "./producers/producer.service";
import { DlqService } from "./dlq/dlq-handler.service";

@Module({
  imports: [HttpModule],
  controllers: [],
  providers: [
    ProducerService,
    DlqService,
  ],
  exports: [ProducerService, DlqService],
})
export class KafkaModule {
  static register(): DynamicModule {
    const mode = process.env.DEPLOYMENT_MODE;
    const role = process.env.APP_ROLE;
    const controllers: Type<any>[] = [];
    return {
      module: KafkaModule,
      controllers: controllers,
    };
  }
}
