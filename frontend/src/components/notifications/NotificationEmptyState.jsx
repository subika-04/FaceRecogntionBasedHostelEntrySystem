import EmptyState from '../ui/EmptyState';

export default function NotificationEmptyState({ title = 'No notifications', description = "You're all caught up." }) {
  return <EmptyState title={title} description={description} />;
}
