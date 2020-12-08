import { BaseEntity, DeepPartial, DeleteDateColumn, ObjectType, PrimaryColumn } from 'typeorm';
import { Expose, plainToClass } from 'class-transformer';

export class Document extends BaseEntity {
  @Expose()
  @PrimaryColumn()
  id: string;

  @DeleteDateColumn()
  deletedAt: Date;

  static create<T extends Document>(this: ObjectType<T>): T;
  static create<T extends Document>(this: ObjectType<T>, entityLike: DeepPartial<T>): T;
  static create<T extends Document>(this: ObjectType<T>, entityLikeArray: DeepPartial<T>[]): T[];
  static create(plain?: DeepPartial<Document> | DeepPartial<Document>[]): Document | Document[] {
    return plainToClass(this, plain ?? {}, { excludeExtraneousValues: true });
  }
}
