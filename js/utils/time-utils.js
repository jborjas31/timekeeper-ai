class TimeUtils {
    static parse12Hour(timeString) {
        try {
            const parts = timeString.trim().split(' ');
            if (parts.length !== 2) throw new Error('Invalid time format');
            
            const [time, period] = parts;
            const timeParts = time.split(':');
            if (timeParts.length !== 2) throw new Error('Invalid time format');
            
            let hour = parseInt(timeParts[0]);
            const minute = parseInt(timeParts[1]);
            
            if (isNaN(hour) || isNaN(minute) || hour < 1 || hour > 12 || minute < 0 || minute > 59) {
                throw new Error('Invalid time values');
            }
            
            if (period === 'PM' && hour !== 12) hour += 12;
            if (period === 'AM' && hour === 12) hour = 0;
            
            return { hour, minute };
        } catch (e) {
            console.error('Error parsing time:', timeString, e);
            return { hour: 9, minute: 0 };
        }
    }

    static format12Hour(timeObj) {
        if (!timeObj || typeof timeObj.hour !== 'number' || typeof timeObj.minute !== 'number') {
            console.error('Invalid timeObj in format12Hour:', timeObj);
            return '9:00 AM'; // Safe fallback
        }
        
        const { hour, minute } = timeObj;
        
        if (hour < 0 || hour > 23 || minute < 0 || minute > 59) {
            console.error('Invalid time values in format12Hour:', timeObj);
            return '9:00 AM'; // Safe fallback
        }
        
        let displayHour = hour;
        const period = hour >= 12 ? 'PM' : 'AM';
        
        if (hour === 0) displayHour = 12;
        else if (hour > 12) displayHour = hour - 12;
        
        return `${displayHour}:${minute.toString().padStart(2, '0')} ${period}`;
    }

    static formatHourLabel(hour) {
        if (hour === 0) return '12 AM';
        if (hour < 12) return `${hour} AM`;
        if (hour === 12) return '12 PM';
        return `${hour - 12} PM`;
    }

    static convertTo24Hour(time12h) {
        if (!time12h || typeof time12h !== 'string') {
            console.error('Invalid input to convertTo24Hour:', time12h);
            return '09:00'; // Safe fallback
        }
        
        try {
            const parts = time12h.trim().split(' ');
            if (parts.length !== 2) {
                throw new Error('Invalid time format - expected "HH:MM AM/PM"');
            }
            
            const [time, period] = parts;
            const timeParts = time.split(':');
            if (timeParts.length !== 2) {
                throw new Error('Invalid time format - expected "HH:MM"');
            }
            
            let hours = parseInt(timeParts[0], 10);
            const minutes = timeParts[1];
            
            if (isNaN(hours) || hours < 1 || hours > 12) {
                throw new Error('Invalid hour value');
            }
            
            if (!/^[0-5][0-9]$/.test(minutes)) {
                throw new Error('Invalid minute value');
            }
            
            if (!['AM', 'PM'].includes(period)) {
                throw new Error('Invalid period - must be AM or PM');
            }
            
            if (period === 'AM' && hours === 12) hours = 0;
            if (period === 'PM' && hours !== 12) hours += 12;
            
            return `${hours.toString().padStart(2, '0')}:${minutes}`;
        } catch (e) {
            console.error('Error converting time to 24h:', time12h, e);
            return '09:00'; // Safe fallback
        }
    }

    static convertTo12Hour(time24h) {
        if (!time24h || typeof time24h !== 'string') {
            console.error('Invalid input to convertTo12Hour:', time24h);
            return '9:00 AM'; // Safe fallback
        }
        
        try {
            const parts = time24h.trim().split(':');
            if (parts.length !== 2) {
                throw new Error('Invalid time format - expected "HH:MM"');
            }
            
            let hours = parseInt(parts[0], 10);
            const minutes = parts[1];
            
            if (isNaN(hours) || hours < 0 || hours > 23) {
                throw new Error('Invalid hour value - must be 0-23');
            }
            
            if (!/^[0-5][0-9]$/.test(minutes)) {
                throw new Error('Invalid minute value');
            }
            
            const period = hours >= 12 ? 'PM' : 'AM';
            if (hours === 0) hours = 12;
            if (hours > 12) hours -= 12;
            
            return `${hours}:${minutes} ${period}`;
        } catch (e) {
            console.error('Error converting time to 12h:', time24h, e);
            return '9:00 AM'; // Safe fallback
        }
    }

    static addMinutes(timeObj, minutes) {
        if (!timeObj || typeof timeObj.hour !== 'number' || typeof timeObj.minute !== 'number') {
            console.error('Invalid timeObj in addMinutes:', timeObj);
            return { hour: 9, minute: 0 }; // Safe fallback
        }
        
        if (typeof minutes !== 'number' || isNaN(minutes)) {
            console.error('Invalid minutes in addMinutes:', minutes);
            return timeObj; // Return original if minutes invalid
        }
        
        const totalMinutes = timeObj.hour * 60 + timeObj.minute + minutes;
        const normalizedMinutes = totalMinutes >= 0 ? totalMinutes : totalMinutes + (24 * 60);
        
        return {
            hour: Math.floor(normalizedMinutes / 60) % 24,
            minute: normalizedMinutes % 60
        };
    }

    static timeToMinutes(timeObj) {
        return timeObj.hour * 60 + timeObj.minute;
    }

    static minutesToTime(totalMinutes) {
        return {
            hour: Math.floor(totalMinutes / 60) % 24,
            minute: totalMinutes % 60
        };
    }

    static formatDateKey(date) {
        return date.toISOString().split('T')[0];
    }

    static isToday(date) {
        const today = new Date();
        return date.toDateString() === today.toDateString();
    }

    static getCurrentHourWithTimezone() {
        const now = new Date();
        // Account for timezone offset to get accurate local hour
        const localOffset = now.getTimezoneOffset();
        const utc = now.getTime() + (localOffset * 60000);
        const localTime = new Date(utc + (this.getTimezoneOffset() * 60000));
        return localTime.getHours();
    }

    static getTimezoneOffset() {
        // Get current timezone offset in minutes
        // Positive for west of UTC, negative for east
        return -(new Date().getTimezoneOffset());
    }

    static isDSTTransition() {
        // Check if we're near a DST transition (within 2 hours)
        const now = new Date();
        const yesterday = new Date(now.getTime() - (24 * 60 * 60 * 1000));
        return Math.abs(now.getTimezoneOffset() - yesterday.getTimezoneOffset()) > 0;
    }

    static getStableCurrentHour() {
        // More reliable current hour that handles DST transitions
        const now = new Date();
        
        // If we're in a DST transition, use UTC time as reference
        if (this.isDSTTransition()) {
            console.log('DST transition detected, using stable time calculation');
            const utcHour = now.getUTCHours();
            const offsetHours = Math.floor(this.getTimezoneOffset() / 60);
            return (utcHour + offsetHours) % 24;
        }
        
        return now.getHours();
    }
}

window.TimeUtils = TimeUtils;