import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ConsoleCustomerEmailService } from './console-customer-email.service';
import { ConsoleEmailService } from './console-email.service';
import { ConsoleSmsService } from './console-sms.service';
import { CUSTOMER_EMAIL_SERVICE } from './customer-email.service.interface';
import { EMAIL_SERVICE } from './email.service.interface';
import { NotificationsFacade } from './notifications.facade';
import { ResendEmailService } from './resend-email.service';
import { SendgridCustomerEmailService } from './sendgrid-customer-email.service';
import { SMS_SERVICE } from './sms.service.interface';
import { TwilioSmsService } from './twilio-sms.service';

@Module({
  imports: [ConfigModule],
  providers: [
    NotificationsFacade,
    ConsoleSmsService,
    TwilioSmsService,
    ConsoleEmailService,
    ResendEmailService,
    ConsoleCustomerEmailService,
    SendgridCustomerEmailService,
    {
      provide: SMS_SERVICE,
      useFactory: (
        config: ConfigService,
        consoleSms: ConsoleSmsService,
        twilio: TwilioSmsService,
      ) => {
        const sid = config.get<string>('TWILIO_ACCOUNT_SID');
        const token = config.get<string>('TWILIO_AUTH_TOKEN');
        if (sid && token) {
          return twilio;
        }
        return consoleSms;
      },
      inject: [ConfigService, ConsoleSmsService, TwilioSmsService],
    },
    {
      provide: EMAIL_SERVICE,
      useFactory: (
        config: ConfigService,
        consoleEmail: ConsoleEmailService,
        resend: ResendEmailService,
      ) => {
        if (config.get<string>('RESEND_API_KEY')) {
          return resend;
        }
        return consoleEmail;
      },
      inject: [ConfigService, ConsoleEmailService, ResendEmailService],
    },
    {
      provide: CUSTOMER_EMAIL_SERVICE,
      useFactory: (
        config: ConfigService,
        consoleCustomer: ConsoleCustomerEmailService,
        sendgrid: SendgridCustomerEmailService,
      ) => {
        if (config.get<string>('SENDGRID_API_KEY')) {
          return sendgrid;
        }
        return consoleCustomer;
      },
      inject: [
        ConfigService,
        ConsoleCustomerEmailService,
        SendgridCustomerEmailService,
      ],
    },
  ],
  exports: [
    NotificationsFacade,
    SMS_SERVICE,
    EMAIL_SERVICE,
    CUSTOMER_EMAIL_SERVICE,
  ],
})
export class NotificationsModule {}
