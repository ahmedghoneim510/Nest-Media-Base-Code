import { SelectQueryBuilder } from 'typeorm';
import { User } from '../entities/user.entity';
import { UserRole } from '../enums/user.enum';

/**
 * User-specific scopes — local to this module.
 * Use these for filters that only make sense for User.
 */
export class UserScopes {
  /**
   * Only active users.
   */
  static active(qb: SelectQueryBuilder<User>, alias = 'user') {
    qb.andWhere(`${alias}.status = :activeStatus`, { activeStatus: 'active' });
    return qb;
  }

  /**
   * Only admins.
   */
  static admins(qb: SelectQueryBuilder<User>, alias = 'user') {
    qb.andWhere(`${alias}.role = :adminRole`, { adminRole: UserRole.ADMIN });
    return qb;
  }

  /**
   * Users who logged in recently (last N days).
   */
  static recentlyActive(qb: SelectQueryBuilder<User>, days = 30, alias = 'user') {
    const date = new Date();
    date.setDate(date.getDate() - days);
    qb.andWhere(`${alias}.last_login >= :since`, { since: date });
    return qb;
  }

  /**
   * Users created within a date range.
   */
  static createdBetween(
    qb: SelectQueryBuilder<User>,
    from: Date,
    to: Date,
    alias = 'user',
  ) {
    qb.andWhere(`${alias}.created_at BETWEEN :from AND :to`, { from, to });
    return qb;
  }
}
