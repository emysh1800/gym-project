import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NotificationService } from '../../core/services/notification.service';

interface ContactFormData {
  name: string;
  phone: string;
  branch: string;
  message: string;
}

@Component({
  selector: 'app-contact-form',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './contact-form.component.html',
})
export class ContactFormComponent {
  contactForm: ContactFormData = {
    name: '',
    phone: '',
    branch: 'الفرع الرئيسي - التجمع',
    message: '',
  };

  constructor(private notification: NotificationService) {}

  handleSubmit(): void {
    if (!this.contactForm.name.trim() || !this.contactForm.phone.trim()) {
      this.notification.show('يرجى كتابة الاسم ورقم الهاتف لإرسال طلبك.');
      return;
    }

    this.notification.show(
      `شكراً لك يا ${this.contactForm.name}! استلمنا طلبك وسيقوم فريق الاستقبال بالتواصل معك قريباً.`
    );

    // Reset form after successful submission
    this.contactForm = {
      name: '',
      phone: '',
      branch: 'الفرع الرئيسي - التجمع',
      message: '',
    };
  }
}
