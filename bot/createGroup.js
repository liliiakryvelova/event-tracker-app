const fs = require('fs-extra');
const path = require('path');

// Path to events database
const EVENTS_DB_PATH = path.join(__dirname, '../db/events.json');

class EventGroupBot {
  constructor() {
    this.groups = new Map();
  }

  // Read events from database
  async readEvents() {
    try {
      const data = await fs.readJson(EVENTS_DB_PATH);
      return data.events || [];
    } catch (error) {
      console.error('Error reading events:', error);
      return [];
    }
  }

  // Write events to database
  async writeEvents(events) {
    try {
      await fs.writeJson(EVENTS_DB_PATH, { events });
      return true;
    } catch (error) {
      console.error('Error writing events:', error);
      return false;
    }
  }

  // Create a new group for events
  async createGroup(groupName, criteria = {}) {
    try {
      const events = await this.readEvents();
      const filteredEvents = this.filterEventsByCriteria(events, criteria);
      
      const group = {
        id: Date.now().toString(),
        name: groupName,
        criteria,
        events: filteredEvents.map(event => event.id),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        memberCount: filteredEvents.length
      };

      this.groups.set(group.id, group);
      
      console.log(`✅ Group "${groupName}" created successfully!`);
      console.log(`📊 Group contains ${group.memberCount} events`);
      console.log(`🆔 Group ID: ${group.id}`);
      
      return group;
    } catch (error) {
      console.error('❌ Error creating group:', error);
      return null;
    }
  }

  // Filter events based on criteria
  filterEventsByCriteria(events, criteria) {
    return events.filter(event => {
      // Filter by date range
      if (criteria.startDate && new Date(event.date) < new Date(criteria.startDate)) {
        return false;
      }
      if (criteria.endDate && new Date(event.date) > new Date(criteria.endDate)) {
        return false;
      }

      // Filter by status
      if (criteria.status && event.status !== criteria.status) {
        return false;
      }

      // Filter by location
      if (criteria.location && !event.location.toLowerCase().includes(criteria.location.toLowerCase())) {
        return false;
      }

      // Filter by title/description keywords
      if (criteria.keyword) {
        const keyword = criteria.keyword.toLowerCase();
        const hasKeyword = 
          event.title.toLowerCase().includes(keyword) ||
          event.description.toLowerCase().includes(keyword);
        if (!hasKeyword) {
          return false;
        }
      }

      // Filter by attendee count
      if (criteria.minAttendees && event.attendees.length < criteria.minAttendees) {
        return false;
      }

      return true;
    });
  }

  // Get group by ID
  getGroup(groupId) {
    return this.groups.get(groupId);
  }

  // List all groups
  listGroups() {
    return Array.from(this.groups.values());
  }

  // Add event to existing group
  async addEventToGroup(groupId, eventId) {
    const group = this.groups.get(groupId);
    if (!group) {
      console.error('❌ Group not found');
      return false;
    }

    if (!group.events.includes(eventId)) {
      group.events.push(eventId);
      group.memberCount = group.events.length;
      group.updatedAt = new Date().toISOString();
      console.log(`✅ Event ${eventId} added to group "${group.name}"`);
      return true;
    }

    console.log(`ℹ️  Event ${eventId} already in group "${group.name}"`);
    return false;
  }

  // Remove event from group
  removeEventFromGroup(groupId, eventId) {
    const group = this.groups.get(groupId);
    if (!group) {
      console.error('❌ Group not found');
      return false;
    }

    const index = group.events.indexOf(eventId);
    if (index > -1) {
      group.events.splice(index, 1);
      group.memberCount = group.events.length;
      group.updatedAt = new Date().toISOString();
      console.log(`✅ Event ${eventId} removed from group "${group.name}"`);
      return true;
    }

    console.log(`ℹ️  Event ${eventId} not found in group "${group.name}"`);
    return false;
  }

  // Get events in a group with full details
  async getGroupEvents(groupId) {
    const group = this.groups.get(groupId);
    if (!group) {
      console.error('❌ Group not found');
      return [];
    }

    const allEvents = await this.readEvents();
    return allEvents.filter(event => group.events.includes(event.id));
  }

  // Update group criteria and refresh events
  async updateGroupCriteria(groupId, newCriteria) {
    const group = this.groups.get(groupId);
    if (!group) {
      console.error('❌ Group not found');
      return false;
    }

    const events = await this.readEvents();
    const filteredEvents = this.filterEventsByCriteria(events, newCriteria);
    
    group.criteria = newCriteria;
    group.events = filteredEvents.map(event => event.id);
    group.memberCount = group.events.length;
    group.updatedAt = new Date().toISOString();

    console.log(`✅ Group "${group.name}" criteria updated`);
    console.log(`📊 Group now contains ${group.memberCount} events`);
    return true;
  }

  // Delete group
  deleteGroup(groupId) {
    const group = this.groups.get(groupId);
    if (!group) {
      console.error('❌ Group not found');
      return false;
    }

    this.groups.delete(groupId);
    console.log(`✅ Group "${group.name}" deleted successfully`);
    return true;
  }
}

// Example usage and CLI interface
async function main() {
  const bot = new EventGroupBot();

  // Example: Create different types of groups
  
  // Group 1: All scheduled events
  await bot.createGroup('Scheduled Events', { status: 'scheduled' });

  // Group 2: Events this week
  const today = new Date();
  const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
  await bot.createGroup('This Week Events', {
    startDate: today.toISOString().split('T')[0],
    endDate: nextWeek.toISOString().split('T')[0]
  });

  // Group 3: Meeting events
  await bot.createGroup('Meetings', { keyword: 'meeting' });

  // Group 4: Large events (3+ attendees)
  await bot.createGroup('Large Events', { minAttendees: 3 });

  // Display all groups
  console.log('\n📋 All Groups:');
  console.log('='.repeat(50));
  const groups = bot.listGroups();
  groups.forEach(group => {
    console.log(`🏷️  ${group.name} (ID: ${group.id})`);
    console.log(`   📊 ${group.memberCount} events`);
    console.log(`   📅 Created: ${new Date(group.createdAt).toLocaleDateString()}`);
    console.log(`   🔍 Criteria: ${JSON.stringify(group.criteria, null, 2)}`);
    console.log('-'.repeat(30));
  });
}

// Export the class for use in other modules
module.exports = EventGroupBot;

// Run main function if this file is executed directly
if (require.main === module) {
  main().catch(console.error);
}
