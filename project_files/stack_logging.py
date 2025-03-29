import logging
import inspect
import functools
import traceback

def get_call_stack():
    """
    Get a formatted string of the current call stack (excluding this function).
    
    Returns:
        str: A formatted call stack string showing the chain of function calls
    """
    stack = inspect.stack()[1:]  # Skip this function itself
    call_chain = []
    
    for frame in stack:
        # Extract just the filename without path
        filename = frame.filename.split('/')[-1]
        call_chain.append(f"{frame.function} in {filename}:{frame.lineno}")
    
    # Format the call chain
    if len(call_chain) > 1:
        return "\n-> ".join(call_chain)
    elif len(call_chain) == 1:
        return call_chain[0]
    else:
        return "unknown"

def log_with_caller(logger, level, message, *args, **kwargs):
    """
    Log a message with information about the full call stack.
    
    Args:
        logger: The logger instance to use
        level: The logging level (e.g., logging.INFO)
        message: The message to log
        *args, **kwargs: Additional arguments for the logger
    """
    # Get the full call stack (skip first two frames - this function and its caller)
    call_stack = get_call_stack()
    
    # Add the call stack to the message
    message = f"{message} [Call stack: {call_stack}]"
    
    # Log the message with the enhanced information
    logger.log(level, message, *args, **kwargs)

def with_caller_logging(func):
    """
    Decorator to add full call stack information to logging in a function.
    Tracks entry, exit, and exceptions with the complete call chain.
    """
    @functools.wraps(func)
    def wrapper(*args, **kwargs):
        logger = logging.getLogger(func.__module__)
        
        # Get the full call stack for this function call
        call_stack = get_call_stack()
        
        # Log entry with call stack
        logger.info(f"Entering {func.__name__} [Call stack: {call_stack}]")
        
        try:
            result = func(*args, **kwargs)
            return result
        except Exception as e:
            # For errors, include both the exception traceback and the call stack
            tb_str = '\n'.join(traceback.format_exception(type(e), e, e.__traceback__))
            logger.error(f"Error in {func.__name__}: {str(e)}\n"
                         f"[Call stack: {call_stack}]\n"
                         f"Traceback:\n{tb_str}")
            raise
        finally:
            # Log exit with call stack
            logger.info(f"Exiting {func.__name__} [Call stack: {call_stack}]")
    
    return wrapper

# Enhanced logger class that includes caller information
class CallerLogger:
    def __init__(self, name):
        self.logger = logging.getLogger(name)
    
    def debug(self, message, *args, **kwargs):
        log_with_caller(self.logger, logging.DEBUG, message, *args, **kwargs)
    
    def info(self, message, *args, **kwargs):
        log_with_caller(self.logger, logging.INFO, message, *args, **kwargs)
    
    def warning(self, message, *args, **kwargs):
        log_with_caller(self.logger, logging.WARNING, message, *args, **kwargs)
    
    def error(self, message, *args, **kwargs):
        log_with_caller(self.logger, logging.ERROR, message, *args, **kwargs)
    
    def critical(self, message, *args, **kwargs):
        log_with_caller(self.logger, logging.CRITICAL, message, *args, **kwargs)

# Method to get a logger that includes caller information
def get_caller_logger(name):
    return CallerLogger(name)