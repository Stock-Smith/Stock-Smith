# Use the official Redis image as the base image
FROM redis:latest

# Set the working directory in the container
WORKDIR /data

# Copy custom Redis configuration if needed
# COPY redis.conf /usr/local/etc/redis/redis.conf

# Expose Redis port
EXPOSE 6379

# Command to run Redis server
# If using custom config, use this command instead:
# CMD ["redis-server", "/usr/local/etc/redis/redis.conf"]
CMD ["redis-server", "--appendonly", "yes"]